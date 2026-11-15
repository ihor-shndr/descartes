// macOS only: PDFKit preserves glyph positions; no OCR or third-party packages.
import PDFKit
import AppKit
import Foundation

let args = CommandLine.arguments
if args.count != 5 {
    fputs("Usage: swift extract.swift SOURCE.pdf PDF_PAGE OUTPUT_DIR SCALE\n", stderr)
    exit(1)
}
do {
    guard let document = PDFDocument(url: URL(fileURLWithPath: args[1])),
          let number = Int(args[2]), number > 0,
          let page = document.page(at: number - 1), let text = page.string else {
        throw NSError(domain: "Cannot read PDF page", code: 1)
    }
    let output = URL(fileURLWithPath: args[3], isDirectory: true)
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    let string = text as NSString
    var glyphs: [[String: Any]] = []
    for i in 0..<string.length {
        let value = string.substring(with: NSRange(location: i, length: 1))
        guard value != "\n", let selection = page.selection(for: NSRange(location: i, length: 1)) else { continue }
        let b = selection.bounds(for: page)
        guard b.width > 0, b.height > 0 else { continue }
        glyphs.append(["text": value, "x": Double(b.minX), "y": Double(b.minY), "width": Double(b.width), "height": Double(b.height)])
    }
    // Baseline candidates are hints, not authoritative lines: superscripts may split a row.
    var rows: [Int: [[String: Any]]] = [:]
    for g in glyphs {
        let mid = (g["y"] as! Double) + (g["height"] as! Double) / 2
        rows[Int((mid / 2).rounded()) * 2, default: []].append(g)
    }
    let lines = rows.keys.sorted(by: >).map { y -> [String: Any] in
        let row = rows[y]!.sorted { ($0["x"] as! Double) < ($1["x"] as! Double) }
        return ["y": y, "text": row.map { $0["text"] as! String }.joined(), "glyphs": row]
    }
    let box = page.bounds(for: .mediaBox)
    let data: [String: Any] = ["pdfPage": number, "width": box.width, "height": box.height,
                               "coordinateOrigin": "bottom-left", "rawText": text, "rows": lines]
    try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys])
        .write(to: output.appendingPathComponent("page.json"))
    let scale = Double(args[4]) ?? 2
    let preview = page.thumbnail(of: NSSize(width: box.width * scale, height: box.height * scale), for: .mediaBox)
    guard let tiff = preview.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff),
          let png = bitmap.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "Cannot render PDF page", code: 2)
    }
    try png.write(to: output.appendingPathComponent("page.png"))
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
