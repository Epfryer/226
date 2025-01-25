export interface Asset {
  id: number;
  originalName: string;
  placeholderPath: string;
  category?: string;
  projectId?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Placeholder assets - replace paths with actual placeholder images
export const placeholderAssets: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    originalName: 'project1-main.jpg',
    placeholderPath: '/assets/placeholders/placeholder1.jpg',
    category: 'residential',
    projectId: 1
  },
  {
    originalName: 'project1-detail1.jpg',
    placeholderPath: '/assets/placeholders/placeholder2.jpg',
    category: 'residential',
    projectId: 1
  },
  {
    originalName: 'project2-main.jpg',
    placeholderPath: '/assets/placeholders/placeholder3.jpg',
    category: 'commercial',
    projectId: 2
  }
];
