import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MovieCard } from '../movie-card';

const mockMovie = {
  id: '123',
  title: 'Inception',
  drive_file_id: 'abc',
  drive_view_url: 'https://drive.google.com/view/abc',
  file_size: 1048576, // 1 MB
  mime_type: 'video/mp4',
  created_at: new Date('2026-09-08').toISOString(),
  original_url: 'https://example.com/movie.mp4',
};

test('renders movie card with correct details', () => {
  const handleDelete = vi.fn();
  render(<MovieCard movie={mockMovie} index={0} onDelete={handleDelete} />);

  // Check if title is rendered
  expect(screen.getByText('Inception')).toBeInTheDocument();

  // Check if size is formatted correctly (1.0 MB)
  expect(screen.getByText('1.0 MB')).toBeInTheDocument();

  // Check if Play link has correct URL
  const playButton = screen.getByText('Play').closest('a');
  expect(playButton).toHaveAttribute('href', 'https://drive.google.com/view/abc');
});

test('calls onDelete when delete button is clicked', () => {
  const handleDelete = vi.fn();
  // Mock window.confirm to always return true
  vi.stubGlobal('confirm', () => true);

  render(<MovieCard movie={mockMovie} index={0} onDelete={handleDelete} />);

  const deleteButton = screen.getByText('Delete');
  fireEvent.click(deleteButton);

  expect(handleDelete).toHaveBeenCalledWith('123');

  vi.unstubAllGlobals();
});
