import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';
import { awsServices } from '../types/aws';

interface InlineTextEditorProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({ svgRef, wrapperRef }) => {
  const { state } = useAppState();
  const { updateNode, updateFrame, setEditingNodeId } = useAppActions();

  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastDoubleClickRef = useRef<number>(0);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [value, setValue] = useState('');

  const editingId = state.editingNodeId;
  const editingNode = editingId !== null
    ? state.nodes.find(node => node.id === editingId) ?? null
    : null;
  const editingFrame = editingId !== null && !editingNode
    ? state.frames.find(frame => frame.id === editingId) ?? null
    : null;
  const targetElement = editingNode ?? editingFrame;

  const closeEditor = useCallback(() => {
    setEditingNodeId(null);
  }, [setEditingNodeId]);

  useEffect(() => {
    if (editingId !== null && !targetElement) {
      closeEditor();
    }
  }, [editingId, targetElement, closeEditor]);

  useEffect(() => {
    if (!targetElement) {
      return;
    }

    const defaultText = awsServices[targetElement.kind]?.buttonText || targetElement.kind;
    setValue(targetElement.label ?? defaultText);
  }, [targetElement]);

  useLayoutEffect(() => {
    if (
      editingId === null ||
      !targetElement ||
      !svgRef.current ||
      !wrapperRef.current
    ) {
      return;
    }

    const textElement = svgRef.current.querySelector<SVGTextElement>(
      `g[data-id="${editingId}"] text`
    );

    if (!textElement) {
      return;
    }

    const textRect = textElement.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();

    setPosition({
      left: textRect.left - wrapperRect.left - 8,
      top: textRect.top - wrapperRect.top - 6,
    });
  }, [editingId, targetElement, svgRef, wrapperRef, state.nodes, state.frames]);

  useEffect(() => {
    const markDoubleClick = () => {
      lastDoubleClickRef.current = typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    };

    document.addEventListener('dblclick', markDoubleClick, true);
    return () => document.removeEventListener('dblclick', markDoubleClick, true);
  }, []);

  useEffect(() => {
    if (editingId === null || !inputRef.current) {
      return;
    }

    const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

    if (now - lastDoubleClickRef.current > 250) {
      return;
    }

    const input = inputRef.current;
    const focusInput = () => {
      input.focus();
      input.select();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focusInput);
    } else {
      focusInput();
    }

    lastDoubleClickRef.current = 0;
  }, [editingId]);

  useEffect(() => {
    if (editingId === null) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!editorRef.current || editorRef.current.contains(event.target as Node)) {
        return;
      }
      closeEditor();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId, closeEditor]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      if (!targetElement) {
        closeEditor();
        return;
      }

      const newText = value.trim();
      if (editingNode) {
        updateNode(editingNode.id, {
          label: newText === '' ? null : newText,
        });
      } else if (editingFrame) {
        updateFrame(editingFrame.id, {
          label: newText === '' ? null : newText,
        });
      }
      closeEditor();
    },
    [editingNode, editingFrame, targetElement, updateNode, updateFrame, value, closeEditor]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event as any);
      }
    },
    [closeEditor, handleSubmit]
  );

  if (editingId === null || !targetElement || !wrapperRef.current) {
    return null;
  }

  return (
    <div
      ref={editorRef}
      className="inline-text-editor"
      style={{ 
        left: position.left, 
        top: position.top,
        margin: 0,
        padding: 0,
        display: 'inline-block',
        border: '1px solid #ccc',
        borderRadius: '3px'
      }}
      role="dialog"
      aria-label="Edit label"
    >
      <form
        onSubmit={handleSubmit}
        style={{ margin: 0, padding: 0 }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder="Enter label"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </form>
    </div>
  );
};

export default InlineTextEditor;
