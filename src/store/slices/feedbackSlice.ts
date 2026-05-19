import { createSlice } from '@reduxjs/toolkit';

type FeedbackType = 'success' | 'error' | 'info';

type FeedbackState = {
  visible: boolean;
  title: string;
  message: string;
  type: FeedbackType;
};

const compactText = (value: unknown, maxLength: number) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const initialState: FeedbackState = {
  visible: false,
  title: '',
  message: '',
  type: 'info'
};

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    showFeedback(state: FeedbackState, action: any) {
      const { title, message, type = 'info' } = action.payload ?? {};
      state.visible = true;
      state.title = compactText(title, 34) || 'Notice';
      state.message = compactText(message, 72);
      state.type = type;
    },
    hideFeedback(state: FeedbackState) {
      state.visible = false;
    }
  }
});

export const { showFeedback, hideFeedback } = feedbackSlice.actions;
export const feedbackReducer = feedbackSlice.reducer;
export type { FeedbackType };
