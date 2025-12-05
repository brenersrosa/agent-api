import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getDashboard() {
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
    return { status: 'accepted', documentId: id };
  }
}

