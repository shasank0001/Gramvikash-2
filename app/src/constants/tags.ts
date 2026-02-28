export type TagType =
  | 'share_rent'
  | 'transport_pool'
  | 'ask_village'
  | 'sell_harvest'
  | 'crop_disease'
  | 'weather_alert'
  | 'government_scheme'
  | 'sos'
  | 'general';

export interface Tag {
  id: TagType;
  label: string;
  icon: string;
  color: string;
  background: string;
  screen: string;
}

export const TAGS: Tag[] = [
  {
    id: 'sell_harvest',
    label: 'Sell Harvest',
    icon: 'storefront',
    color: '#1B6B2F',
    background: '#E8F5E9',
    screen: 'Mandi',
  },
  {
    id: 'share_rent',
    label: 'Share & Rent',
    icon: 'handshake',
    color: '#1565C0',
    background: '#E3F2FD',
    screen: 'Resources',
  },
  {
    id: 'transport_pool',
    label: 'Transport Pool',
    icon: 'local-shipping',
    color: '#E65100',
    background: '#FFF3E0',
    screen: 'Resources',
  },
  {
    id: 'ask_village',
    label: 'Ask the Village',
    icon: 'forum',
    color: '#6A1B9A',
    background: '#F3E5F5',
    screen: 'Feed',
  },
  {
    id: 'crop_disease',
    label: 'Crop Disease',
    icon: 'bug-report',
    color: '#558B2F',
    background: '#F1F8E9',
    screen: 'AICoPilot',
  },
  {
    id: 'weather_alert',
    label: 'Weather Alert',
    icon: 'thunderstorm',
    color: '#0277BD',
    background: '#E1F5FE',
    screen: 'Feed',
  },
  {
    id: 'government_scheme',
    label: 'Govt Schemes',
    icon: 'account-balance',
    color: '#BF360C',
    background: '#FBE9E7',
    screen: 'Schemes',
  },
  {
    id: 'sos',
    label: 'Emergency SOS',
    icon: 'emergency',
    color: '#B71C1C',
    background: '#FFEBEE',
    screen: 'SOS',
  },
];

export const TAG_MAP: Record<TagType, Tag> = Object.fromEntries(
  TAGS.map((t) => [t.id, t])
) as Record<TagType, Tag>;
