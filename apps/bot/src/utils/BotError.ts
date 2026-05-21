export class BotError extends Error {
  constructor(
    message: string,
    public userMessage: string,
  ) {
    super(message);
    this.name = "BotError";
  }
}
