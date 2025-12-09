import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new CacheService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('gera chave ordenando parametros', () => {
    const key = service.generateKey('prefix', { b: 2, a: 1 });
    expect(key).toBe('prefix:a:1|b:2');
  });

  it('armazena e recupera valores dentro do TTL', () => {
    service.set('chave', { valor: 123 }, 1000);
    jest.advanceTimersByTime(500);
    expect(service.get<{ valor: number }>('chave')).toEqual({ valor: 123 });
  });

  it('expira valores após TTL', () => {
    service.set('chave', 'teste', 1000);
    jest.advanceTimersByTime(1001);
    expect(service.get('chave')).toBeNull();
  });

  it('invalida chaves por prefixo', () => {
    service.set('noticias:1', 'a');
    service.set('noticias:2', 'b');
    service.set('outro:1', 'c');

    service.invalidateByPrefix('noticias');

    expect(service.get('noticias:1')).toBeNull();
    expect(service.get('noticias:2')).toBeNull();
    expect(service.get('outro:1')).toBe('c');
  });

  it('remove chave especifica', () => {
    service.set('chave', 1);
    expect(service.delete('chave')).toBe(true);
    expect(service.get('chave')).toBeNull();
  });

  it('limpa todo o cache', () => {
    service.set('a', 1);
    service.set('b', 2);
    service.clear();
    expect(service.get('a')).toBeNull();
    expect(service.get('b')).toBeNull();
  });

  it('retorna estatisticas incluindo expirados', () => {
    service.set('ativo', 1, 1000);
    service.set('expirado', 2, 1000);
    jest.advanceTimersByTime(1500);

    const stats = service.getStats();

    expect(stats.totalEntries).toBe(2);
    expect(stats.validEntries).toBe(0);
    expect(stats.expiredEntries).toBe(2);
  });
});

