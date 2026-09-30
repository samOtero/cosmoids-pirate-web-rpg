export class EditorSourceError extends Error {
  constructor(
    message: string,
    public status = 422
  ) {
    super(message);
  }
}
