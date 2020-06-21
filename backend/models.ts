export class Question {
  private question_no : number;
  private question : string;
  private options : number[];
  private pick : number;
  private correct_answer : number;
  private scoreboard_id : number;

  private time : number;
  private start_time : Date;

  constructor(question_no : number, question : string, options : number[], pick : number, correct_answer : number, time : number) {
    this.question_no = question_no;
    this.question = question;
    this.options = options;
    this.pick = pick;
    this.correct_answer = correct_answer;
    this.time = time;
    this.scoreboard_id = 0;
    this.start_time = new Date();
  }

  public getQuestion() : string {
    return this.question;
  }

  public getOptions() : number[] {
    return this.options;
  }

  public getPick() : number {
    return this.pick;
  }

  public setPick(pick : number) {
    this.pick = pick;
  }

  public getTime() : number {
    return this.time;
  }

  public active() {
    this.start_time = new Date();
  }

  public getQuestionNo() {
    return this.question_no;
  }

  public getScoreboard() : number {
    return this.scoreboard_id;
  }

  public setScoreboard(id : number) {
    this.scoreboard_id = id;
  }

  public getCorrect() : number {
    return this.correct_answer;
  }

  public inactive() {
    let end_time = new Date();
    this.time += end_time.getTime() - this.start_time.getTime();
  }

  public getPacked() : any[] {
    let result : any[] = [];
    result.push(this.scoreboard_id);
    result.push(this.question_no);
    result.push(this.question);
    result.push(this.options[0]);
    result.push(this.options[1]);
    result.push(this.options[2]);
    result.push(this.options[3]);
    result.push(this.time);
    result.push(this.correct_answer);
    result.push(this.pick);
    return result;
  }
}

export interface QuestionPacked {
  question_no : number,
  question : string,
  options : number[],
  pick : number,
  time : number,
  correct : number
}

export interface QuizRules {
  question_count : number;
  min_product : number;
  max_product : number;
  min_length : number;
  max_length : number;
  description: string;
  penalty : number;
  range : number;
  signs: string;
  name: string;
}

export interface Score {
  date : string;
  user : string;
  points : string;
  time : string;
}