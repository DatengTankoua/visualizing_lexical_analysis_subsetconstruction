import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DSLInput from './DSLInput';

describe('DSLInput Component', () => {
  const mockOnLoad = vi.fn();
  const mockOnParseResult = vi.fn();

  beforeEach(() => {
    mockOnLoad.mockClear();
    mockOnParseResult.mockClear();
  });

  describe('Text Input', () => {
    it('should render textarea with placeholder', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByPlaceholderText(/Fügen Sie hier Ihre DSL ein/i);
      expect(textarea).toBeInTheDocument();
    });

    it('should update text when typing', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '.q0 -a> (q1);' } });
      
      expect(textarea).toHaveValue('.q0 -a> (q1);');
    });

    it('should have correct styling classes', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('w-full', 'h-40');
    });
  });

  describe('Load Button', () => {
    it('should be disabled when text is empty', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const button = screen.getByRole('button', { name: /NFA laden/i });
      expect(button).toBeDisabled();
    });

    it('should be enabled when text is present', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '.q0 -a> (q1);' } });
      
      const button = screen.getByRole('button', { name: /NFA laden/i });
      expect(button).not.toBeDisabled();
    });

    it('should call onLoad with text when clicked', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      const testDSL = '.q0 -a> (q1);';
      fireEvent.change(textarea, { target: { value: testDSL } });
      
      const button = screen.getByRole('button', { name: /NFA laden/i });
      fireEvent.click(button);
      
      expect(mockOnLoad).toHaveBeenCalledWith(testDSL);
    });

    it('should disable button when text contains only whitespace', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });
      
      const button = screen.getByRole('button', { name: /NFA laden/i });
      expect(button).toBeDisabled();
    });

    it('should call onLoad without showing loading state', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '.q0 -a> (q1);' } });
      
      const button = screen.getByRole('button', { name: /NFA laden/i });
      fireEvent.click(button);
      
      expect(mockOnLoad).toHaveBeenCalledWith('.q0 -a> (q1);');
      expect(button).toHaveTextContent(/NFA laden/i);
    });
  });

  describe('File Upload', () => {
    it('should render file input with correct accept types', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      // Find file input by type attribute since it doesn't have a proper label
      const fileInputs = document.querySelectorAll('input[type="file"]');
      expect(fileInputs.length).toBeGreaterThan(0);
      const fileInput = fileInputs[0] as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.aef,.dsl,.txt');
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('should load file content into textarea', async () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const fileContent = '.q0 -a> (q1);';
      const file = new File([fileContent], 'test.aef', { type: 'text/plain' });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(fileContent);
      });
    });

    it('should handle multiple line file content', async () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const fileContent = `# @NAME Test
.q0 -a> q1;
q1 -b> (q2);`;
      const file = new File([fileContent], 'test.aef', { type: 'text/plain' });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(fileContent);
      });
    });

    it('should reject files larger than 1 MB', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      // Erstelle eine Datei > 1 MB
      const largeContent = 'x'.repeat(1024 * 1024 + 1); // 1 MB + 1 Byte
      const file = new File([largeContent], 'large.aef', { type: 'text/plain' });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      expect(mockOnParseResult).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Datei ist zu groß'),
      });
    });

    it('should accept files up to 1 MB', async () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      // Erstelle eine Datei exakt 1 MB
      const content = 'x'.repeat(1024 * 1024); // Exakt 1 MB
      const file = new File([content], 'max-size.aef', { type: 'text/plain' });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(content);
      });
      
      expect(mockOnParseResult).not.toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('Example Selection', () => {
    it('should render example dropdown', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should have default placeholder option', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const select = screen.getByRole('combobox');
      const defaultOption = screen.getByText('Wählen Sie ein Beispiel...');
      
      expect(defaultOption).toBeInTheDocument();
      expect(select).toHaveValue('');
    });

    it('should have example option', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      expect(screen.getByText('Example NFA - mit ε')).toBeInTheDocument();
    });

    it('should load example file when selected', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('.q0 -a> (q1);'),
        } as Response)
      ) as unknown as typeof fetch;

      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'example_nfa' } });
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('.q0 -a> (q1);');
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/examples/example_nfa.aef');
    });

    it('should disable select while loading', async () => {
      global.fetch = vi.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve('.q0 -a> (q1);'),
            } as Response);
          }, 100);
        })
      ) as unknown as typeof fetch;

      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'example_nfa' } });
      
      expect(select).toBeDisabled();
      
      await waitFor(() => {
        expect(select).not.toBeDisabled();
      }, { timeout: 200 });
    });

    it('should keep selected example after loading', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('.q0 -a> (q1);'),
        } as Response)
      ) as unknown as typeof fetch;

      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'example_nfa' } });
      
      await waitFor(() => {
        expect(select).toHaveValue('example_nfa');
      });
    });
  });

  describe('UI Structure', () => {
    it('should have correct section headings', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      expect(screen.getByText(/DSL-Eingabe \(AEF-Format\)/i)).toBeInTheDocument();
    });

    it('should display emoji icons', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      expect(screen.getByText(/📁 Beispiel laden/i)).toBeInTheDocument();
      expect(screen.getByText(/📤 Datei hochladen/i)).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('font-mono');
    });
  });

  describe('Integration Behavior', () => {
    it('should clear previous state when loading new example', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('.q0 -a> (q1);'),
        } as Response)
      ) as unknown as typeof fetch;

      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'old content' } });
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'example_nfa' } });
      
      await waitFor(() => {
        expect(textarea).toHaveValue('.q0 -a> (q1);');
      });
    });

    it('should allow loading after file upload', async () => {
      render(<DSLInput onLoad={mockOnLoad} onParseResult={mockOnParseResult} />);
      
      const fileContent = '.q0 -a> (q1);';
      const file = new File([fileContent], 'test.aef', { type: 'text/plain' });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(fileContent);
      });
      
      const button = screen.getByRole('button', { name: /NFA laden/i });
      fireEvent.click(button);
      
      expect(mockOnLoad).toHaveBeenCalledWith(fileContent);
    });
  });
});
