import { StatusMap } from "elysia";

type HttpStatus = keyof StatusMap | StatusMap[keyof StatusMap];

export class HttpError extends Error {
  public readonly status: number;

  constructor(status: HttpStatus, message: string) {
    super(message);
    if (typeof status === "number") this.status = status;
    else this.status = StatusMap[status];
  }

  toResponse() {
    return Response.json(
      {
        error: this.message,
        code: this.status,
      },
      {
        status: this.status,
      },
    );
  }
}
