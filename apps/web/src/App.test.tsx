import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

class MockBlob {
  constructor(private readonly parts: BlobPart[]) {}

  async text() {
    return this.parts.join('');
  }
}

const fetchMock = vi.fn<typeof fetch>();
const createObjectUrlMock = vi.fn(() => 'blob:test-url');
const revokeObjectUrlMock = vi.fn();
const clickMock = vi.fn();

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('Blob', MockBlob as unknown as typeof Blob);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickMock(this.href, this.download);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
    clickMock.mockClear();
  });

  it('loads templates and renders backend preview', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'default',
              displayName: 'Default',
              description: 'Classic professional template.',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response('<section><h1>Jane Doe</h1><p>Preview</p></section>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      );

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Classic professional template.');
    await user.click(screen.getByRole('button', { name: 'Generate preview' }));

    await waitFor(() => {
      expect(screen.getByTitle('CV preview')).toHaveAttribute(
        'srcdoc',
        '<section><h1>Jane Doe</h1><p>Preview</p></section>',
      );
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/templates');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/cv/preview',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const previewPayload = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(previewPayload.templateId).toBe('default');
    expect(previewPayload.personal.fullName).toBe('Jane Doe');
  });

  it('exports cv data without templateId', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 'default',
            displayName: 'Default',
            description: 'Classic professional template.',
          },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Classic professional template.');
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    const [firstCall] = createObjectUrlMock.mock.calls;
    const blob: unknown = firstCall?.[0];
    if (!(blob instanceof MockBlob)) {
      throw new Error('Expected export blob.');
    }

    const exportedText = await blob.text();
    const parsed = JSON.parse(exportedText);

    expect(parsed.personal.fullName).toBe('Jane Doe');
    expect(parsed.templateId).toBeUndefined();
    expect(clickMock).toHaveBeenCalledWith('blob:test-url', 'cvgator-cv.json');
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:test-url');
  });

  it('imports valid json and rejects invalid json without replacing state', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'default',
              displayName: 'Default',
              description: 'Classic professional template.',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response('<section><h1>Imported Name</h1></section>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      );

    render(<App />);
    await screen.findByText('Classic professional template.');

    const fileInput = document.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Expected file input.');
    }

    const validJson = JSON.stringify({
      personal: {
        fullName: 'Imported Name',
        title: 'Engineer',
        email: 'imported@example.com',
        phone: '+33 6 99 99 99 99',
        location: 'Nantes, France',
        summary: 'Imported profile',
      },
      experience: [],
      education: [],
      skills: [{ name: 'TypeScript' }],
    });
    const validFile = new File([validJson], 'valid.json', { type: 'application/json' });
    Object.defineProperty(validFile, 'text', {
      value: () => Promise.resolve(validJson),
    });

    fireEvent.change(fileInput, { target: { files: [validFile] } });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Imported Name')).toBeInTheDocument();
    });

    const invalidFile = new File(['{"bad":true}'], 'invalid.json', { type: 'application/json' });
    Object.defineProperty(invalidFile, 'text', {
      value: () => Promise.resolve('{"bad":true}'),
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await screen.findByText('Import file does not match the CV data format.');
    expect(screen.getByDisplayValue('Imported Name')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Generate preview' }));
    await waitFor(() => {
      expect(screen.getByTitle('CV preview')).toHaveAttribute('srcdoc', '<section><h1>Imported Name</h1></section>');
    });
  });

  it('exports pdf using backend response and downloaded filename', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'default',
              displayName: 'Default',
              description: 'Classic professional template.',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        }),
      );

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Classic professional template.');
    await user.click(screen.getByRole('button', { name: 'Export PDF' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8080/api/cv/pdf',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    const exportPayload = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(exportPayload.templateId).toBe('default');
    expect(exportPayload.personal.fullName).toBe('Jane Doe');
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledWith('blob:test-url', 'cvgator-cv.pdf');
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:test-url');
  });

  it('shows pdf export error when backend export fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'default',
              displayName: 'Default',
              description: 'Classic professional template.',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Classic professional template.');
    await user.click(screen.getByRole('button', { name: 'Export PDF' }));

    await screen.findByText('Unable to export PDF right now.');
  });
});
