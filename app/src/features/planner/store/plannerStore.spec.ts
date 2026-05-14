import { beforeEach, describe, expect, it } from 'vitest';
import { usePlannerStore } from './plannerStore';

describe('plannerStore', () => {
  beforeEach(() => {
    usePlannerStore.getState().reset();
    usePlannerStore.setState({
      mode: 'idle',
      selectedRouteId: null,
      plannerResults: null,
      openMenuFn: null,
    });
  });

  it('inicia com mode idle, sem endpoints e sem rota selecionada', () => {
    const state = usePlannerStore.getState();

    expect(state.mode).toBe('idle');
    expect(state.origin).toBeNull();
    expect(state.destination).toBeNull();
    expect(state.selectedRouteId).toBeNull();
  });

  it('openPlanner muda mode para planning; closePlanner volta para idle', () => {
    usePlannerStore.getState().openPlanner();
    expect(usePlannerStore.getState().mode).toBe('planning');

    usePlannerStore.getState().closePlanner();
    expect(usePlannerStore.getState().mode).toBe('idle');
  });

  it('swap troca origin e destination', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });
    store.setDestination({ kind: 'stop', idParada: 'B', nome: 'Parada B' });

    usePlannerStore.getState().swap();

    const state = usePlannerStore.getState();
    expect(state.origin).toEqual({ kind: 'stop', idParada: 'B', nome: 'Parada B' });
    expect(state.destination).toEqual({ kind: 'stop', idParada: 'A', nome: 'Parada A' });
  });

  it('swap funciona quando apenas um endpoint está definido', () => {
    usePlannerStore.getState().setOrigin({ kind: 'stop', idParada: 'X', nome: 'Parada X' });

    usePlannerStore.getState().swap();

    const state = usePlannerStore.getState();
    expect(state.origin).toBeNull();
    expect(state.destination).toEqual({ kind: 'stop', idParada: 'X', nome: 'Parada X' });
  });

  it('isSameEndpoint retorna true quando origem e destino são a mesma parada', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'X', nome: 'Parada X' });
    store.setDestination({ kind: 'stop', idParada: 'X', nome: 'Parada X duplicata' });

    expect(usePlannerStore.getState().isSameEndpoint()).toBe(true);
  });

  it('isSameEndpoint retorna false quando paradas são diferentes', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });
    store.setDestination({ kind: 'stop', idParada: 'B', nome: 'Parada B' });

    expect(usePlannerStore.getState().isSameEndpoint()).toBe(false);
  });

  it('isSameEndpoint retorna false quando apenas um endpoint definido', () => {
    usePlannerStore.getState().setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });

    expect(usePlannerStore.getState().isSameEndpoint()).toBe(false);
  });

  it('canPlan retorna false quando destino é null', () => {
    usePlannerStore.getState().setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });

    expect(usePlannerStore.getState().canPlan()).toBe(false);
  });

  it('canPlan retorna false quando origem é null', () => {
    usePlannerStore.getState().setDestination({ kind: 'stop', idParada: 'B', nome: 'Parada B' });

    expect(usePlannerStore.getState().canPlan()).toBe(false);
  });

  it('canPlan retorna false quando origem e destino são a mesma parada', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'X', nome: 'Parada X' });
    store.setDestination({ kind: 'stop', idParada: 'X', nome: 'Parada X' });

    expect(usePlannerStore.getState().canPlan()).toBe(false);
  });

  it('canPlan retorna false quando origem é current-location', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'current-location', nome: 'Minha localização' });
    store.setDestination({ kind: 'stop', idParada: 'B', nome: 'Parada B' });

    expect(usePlannerStore.getState().canPlan()).toBe(false);
  });

  it('canPlan retorna false quando destino é current-location', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });
    store.setDestination({ kind: 'current-location', nome: 'Minha localização' });

    expect(usePlannerStore.getState().canPlan()).toBe(false);
  });

  it('canPlan retorna true quando dois stops distintos definidos', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });
    store.setDestination({ kind: 'stop', idParada: 'B', nome: 'Parada B' });

    expect(usePlannerStore.getState().canPlan()).toBe(true);
  });

  it('reset limpa origin, destination, selectedRouteId e plannerResults', () => {
    const store = usePlannerStore.getState();
    store.setOrigin({ kind: 'stop', idParada: 'A', nome: 'Parada A' });
    store.setDestination({ kind: 'stop', idParada: 'B', nome: 'Parada B' });
    store.setSelectedRouteId('route-123');
    store.setResults({
      originStopId: 'A',
      originStopName: 'Parada A',
      destinationStopId: 'B',
      destinationStopName: 'Parada B',
      generatedAt: '2026-05-13T10:00:00.000Z',
      alternatives: [],
    });

    usePlannerStore.getState().reset();

    const state = usePlannerStore.getState();
    expect(state.origin).toBeNull();
    expect(state.destination).toBeNull();
    expect(state.selectedRouteId).toBeNull();
    expect(state.plannerResults).toBeNull();
  });

  it('registerOpenMenu guarda callback para reabrir o menu mobile', () => {
    const callback = () => undefined;
    usePlannerStore.getState().registerOpenMenu(callback);
    expect(usePlannerStore.getState().openMenuFn).toBe(callback);
  });
});
