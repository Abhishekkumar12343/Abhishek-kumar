export interface Control {
  name: string;
  min: number;
  max: number;
  default: number;
  value: number;
}

export interface Simulation {
  id?: string;
  userId?: string;
  concept: string;
  explanation?: string;
  code: string;
  controls: Control[];
  createdAt?: string;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface GeneratedAsset {
  id?: string;
  userId: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  model: string;
  createdAt: string;
}

export type TabType = 'simulator' | 'gallery';
