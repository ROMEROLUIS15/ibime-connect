  it('should handle malformed RATE_LIMIT_EXCEEDED error gracefully', () => {
    const mockReq = {
      path: '/api/v1/chat',
      requestId: 'req-456'
    } as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    // Create a mock error with malformed format (without seconds)
    const error = new Error('RATE_LIMIT_EXCEEDED:malformed-format');

    // Execute the middleware
    errorHandler(error, mockReq, mockRes, next);

    // Verify that the response was handled correctly
    expect(mockRes.status).toHaveBeenCalledWith(429);
    // Since parsing fails, the default text and retryAfterSeconds should be used
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'El asistente está muy ocupado. Por favor intenta en un momento.',
      retryAfterSeconds: 60, // Default value when parsing fails
      requestId: 'req-456',
    });
  });

  it('should handle non-RATE_LIMIT_EXCEEDED errors normally', () => {
    const mockReq = {} as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    const error = new Error('Something went wrong');

    // Execute the middleware
    errorHandler(error, mockReq, mockRes, next);

    // Verify that the response was handled normally
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'Something went wrong',
      error: 'Something went wrong',
      requestId: 'unknown',
    });
  });

  it('should handle AppError instances appropriately', () => {
    // Create a mock AppError with statusCode property
    const mockAppError = {
      message: 'Bad Request',
      statusCode: 400,
    };

    const mockReq = {} as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    // Execute the middleware
    errorHandler(mockAppError as any, mockReq, mockRes, next);

    // Verify that the response was handled with the AppError's status code
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      text: 'Bad Request',
      error: 'Bad Request',
      requestId: 'unknown',
    });
  });
});