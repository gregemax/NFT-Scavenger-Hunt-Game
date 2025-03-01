import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import type { Hints } from "../hints/hints.entity"
import { UserProgress } from "./user-progress.entity"
import { UsersService } from "src/users/users.service"
import { PuzzlesService } from "src/puzzles/puzzles.service"
import { HintsService } from "src/hints/hints.service"

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,

    //define dependency injection for user service
    private readonly userservice: UsersService,

    //define dependency injection for puzzle service
    private readonly puzzleservice: PuzzlesService,

    //define dependency injection for hint service
    private readonly hintservice: HintsService,

  ) {}

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return this.userProgressRepository.find({
      where: { user: { id: userId } },
      relations: ["puzzles", "hints"],
    })
  }

  async updateProgress(userId: number, puzzleId: number, hintId: number | null, completed: boolean): Promise<UserProgress> {
    let progress = await this.userProgressRepository.findOne({
      where: { user: { id: userId }, puzzles: { id: puzzleId } },
    })

    if (!progress) {
      progress = this.userProgressRepository.create({
        user: { id: userId },
        puzzles: { id: puzzleId },
      })
    }

    if (hintId) {
      progress.hints = { id: hintId } as Hints
      progress.hintsUsed += 1
    }

    progress.completed = completed
    progress.lastUpdated = new Date()

    return this.userProgressRepository.save(progress)
  }

  async getUserScore(userId: number): Promise<number> {
    const progress = await this.userProgressRepository.find({
      where: { user: { id: userId }, completed: true },
      relations: ["puzzle"],
    })

    return progress.reduce((total, p) => total + p.puzzles.pointValue, 0)
  }
}

