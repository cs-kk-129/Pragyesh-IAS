// Simple in-memory storage for mock test attempts to avoid database schema conflicts
interface MockTestAttempt {
  id: number;
  userId: number;
  quizId: number;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
  answers: any[];
  submittedAt: string;
  userName: string;
  quizTitle: string;
}

class MockTestStorage {
  private attempts: MockTestAttempt[] = [];
  private nextId = 1;

  saveAttempt(attempt: Omit<MockTestAttempt, 'id' | 'submittedAt'>): MockTestAttempt {
    const newAttempt: MockTestAttempt = {
      ...attempt,
      id: this.nextId++,
      submittedAt: new Date().toISOString()
    };
    
    this.attempts.push(newAttempt);
    console.log(`Mock test attempt saved: User ${attempt.userId}, Score ${attempt.score}%`);
    return newAttempt;
  }

  getAllAttempts(): MockTestAttempt[] {
    return this.attempts.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getAttemptsByUser(userId: number): MockTestAttempt[] {
    return this.attempts
      .filter(attempt => attempt.userId === userId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }
}

export const mockTestStorage = new MockTestStorage();