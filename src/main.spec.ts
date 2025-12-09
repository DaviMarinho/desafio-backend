import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('main bootstrap', () => {
  const mockEnableCors = jest.fn();
  const mockUseGlobalPipes = jest.fn();
  const mockListen = jest.fn().mockResolvedValue(undefined);
  let bootstrapFn: () => Promise<void>;
  let NestFactoryMock: { create: jest.Mock };
  let AppModuleRef: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    NestFactoryMock = jest.requireMock('@nestjs/core').NestFactory;
    (NestFactoryMock.create as jest.Mock).mockResolvedValue({
      enableCors: mockEnableCors,
      useGlobalPipes: mockUseGlobalPipes,
      listen: mockListen,
    });

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.env.NODE_ENV = 'test';

    AppModuleRef = (await import('./app.module')).AppModule;
    const mainModule = await import('./main');
    bootstrapFn = mainModule.bootstrap;
  });

  it('sobe aplicação com porta customizada', async () => {
    process.env.PORT = '4000';

    await bootstrapFn();

    const [moduleArg, adapterArg] = NestFactoryMock.create.mock.calls[0];
    expect(moduleArg).toBe(AppModuleRef);
    expect(adapterArg).toBeDefined();
    expect(mockEnableCors).toHaveBeenCalled();
    const validationPipe = mockUseGlobalPipes.mock.calls[0][0];
    expect(validationPipe).toBeDefined();
    expect((validationPipe as any).validatorOptions?.whitelist).toBe(true);
    expect(mockListen).toHaveBeenCalledWith('4000', '0.0.0.0');
    expect(console.log).toHaveBeenCalledWith(
      'Application is running on: http://localhost:4000',
    );
  });

  it('usa porta padrão 3001 quando PORT não definido', async () => {
    delete process.env.PORT;

    await bootstrapFn();

    expect(mockListen).toHaveBeenCalledWith(3001, '0.0.0.0');
  });
});
