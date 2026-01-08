import { LanguageCode, FlowDirection } from './store';

/**
 * Reader settings that persist in localStorage
 */
export interface ReaderSettings {
  selectedLanguages: LanguageCode[];
  flowDirection: FlowDirection;
}
