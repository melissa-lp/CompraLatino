// Error con código HTTP
export class OrderError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}
