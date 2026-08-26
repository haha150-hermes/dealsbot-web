import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.history.pushState({}, '', '/deals');
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders deals returned by the read-only API', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        {
          id: 45230,
          title: 'Live database product',
          price: '486 kr',
          previous_price: '2 051 kr',
          url: 'https://www.amazon.se/dp/B0TEST?tag=test-21',
        },
      ],
      count: 1,
    }),
  });

  render(<App />);

  expect(await screen.findByText('Live database product')).toBeInTheDocument();
  expect(screen.getByText('486 kr')).toBeInTheDocument();
  expect(screen.getByText('Tidigare angivet pris: 2 051 kr')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/api/deals?limit=50', expect.any(Object));
});

test('renders the AdSense and CMP disclosure on the privacy page', () => {
  window.history.pushState({}, '', '/integritet');

  render(<App />);

  expect(screen.getByRole('heading', { name: 'Integritetspolicy' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Google AdSense och samtycke' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Googles information om annonser och integritet/ })).toHaveAttribute(
    'href',
    'https://policies.google.com/technologies/ads?hl=sv',
  );
});
