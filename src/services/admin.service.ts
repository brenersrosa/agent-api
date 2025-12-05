import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getDashboard() {
    // TODO: Implementar dashboard
    return {
      stats: {
        totalOrganizations: 0,
        activeSubscriptions: 0,
        totalDocuments: 0,
        totalMessages: 0,
      },
    };
  }

  async reindexDocument(id: string) {
    // TODO: Implementar reindexação
    return { status: 'accepted', documentId: id };
  }
}

