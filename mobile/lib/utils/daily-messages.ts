import AsyncStorage from '@react-native-async-storage/async-storage';
import { now, getYear, getMonth } from '@/lib/date-time-utils';

// Uplifting and suggestive messages for days with no events
const DAILY_MESSAGES = [
  'This day looks free, go and blow some bubbles.',
  'Nothing planned? Perfect time for a spontaneous adventure.',
  'Your schedule is clear - time to chase some dreams.',
  'Free day ahead! What will you discover today?',
  'No commitments? Sounds like freedom to me.',
  'Empty calendar, full possibilities.',
  'Today is yours to shape however you want.',
  'Nothing scheduled means everything is possible.',
  'Free time is the best time to try something new.',
  'Your day is a blank canvas - paint it however you like.',
  'No plans? Perfect opportunity to be spontaneous.',
  'Clear schedule, clear mind, clear path forward.',
  "Today's agenda: whatever makes you happy.",
  'Nothing planned, everything possible.',
  'Free day = free spirit day.',
  "Your calendar is empty, but your potential isn't.",
  'No meetings, no deadlines, just pure possibility.',
  'Today is wide open - what will you fill it with?',
  'Empty schedule, endless opportunities.',
  'Nothing planned? Time to plan something amazing.',
  "Free time is the universe's way of saying 'go explore'.",
  'No commitments today - just pure freedom.',
  'Your day is completely yours to design.',
  'Nothing scheduled means you can schedule anything.',
  'Free day ahead - make it count.',
  'Empty calendar, full heart, endless possibilities.',
  'No plans? Perfect time to make some memories.',
  'Today is a gift - unwrap it however you want.',
  'Nothing scheduled, everything achievable.',
  'Free time is the best time to follow your curiosity.',
  'Your day is a story waiting to be written.',
  'No commitments = maximum flexibility.',
  'Empty schedule, unlimited potential.',
  'Nothing planned? Time to plan something wonderful.',
  'Free day = adventure day.',
  'Today is completely open - what will you choose?',
  'No meetings, no deadlines, just pure joy.',
  'Nothing scheduled means you can schedule joy.',
  'Free time is the perfect time to be yourself.',
  'Your calendar is empty, but your life is full.',
  'No plans? Perfect opportunity to be present.',
  'Today is yours - make it extraordinary.',
  'Nothing committed, everything possible.',
  'Free day ahead - time to shine.',
  'Empty schedule, full of potential.',
  'No obligations today - just pure being.',
  'Nothing planned? Time to plan some fun.',
  'Free time is the best time to grow.',
  'Today is completely yours to enjoy.',
  'No commitments, just pure freedom.',
  'Nothing scheduled means you can schedule happiness.',
  'Free day = self-care day.',
  'Your day is wide open - what will you create?',
  'No plans? Perfect time to be grateful.',
  'Nothing committed, everything available.',
  "Free time is the universe's gift to you.",
  'Today is a fresh start - make it count.',
  'No meetings, no deadlines, just pure life.',
  'Nothing scheduled means you can schedule love.',
  'Free day ahead - time to be amazing.',
  'Empty calendar, full of dreams.',
  'No obligations, just pure possibility.',
  'Nothing planned? Time to plan some magic.',
];

const MESSAGES_STORAGE_KEY = 'daily_messages_tracker';

interface MessageTracker {
  month: string; // e.g., "2024-10"
  usedIndices: number[];
}

/**
 * Get a daily message for a specific date, ensuring variety throughout the month
 */
export async function getDailyMessage(forDate: Date = now()): Promise<string> {
  try {
    const currentMonth = `${getYear(forDate)}-${String(getMonth(forDate) + 1).padStart(2, '0')}`;
    const dateKey = `${getYear(forDate)}-${String(getMonth(forDate) + 1).padStart(2, '0')}-${String(forDate.getDate()).padStart(2, '0')}`;

    // Check if we already have a message for this specific date
    const dateMessageKey = `daily_message_${dateKey}`;
    const existingMessage = await AsyncStorage.getItem(dateMessageKey);
    if (existingMessage) {
      return existingMessage;
    }

    // Get or create message tracker
    const storedTracker = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    let tracker: MessageTracker = storedTracker
      ? JSON.parse(storedTracker)
      : { month: currentMonth, usedIndices: [] };

    // Reset if it's a new month
    if (tracker.month !== currentMonth) {
      tracker = { month: currentMonth, usedIndices: [] };
    }

    // If we've used all messages, reset for the month
    if (tracker.usedIndices.length >= DAILY_MESSAGES.length) {
      tracker.usedIndices = [];
    }

    // Find an unused message index
    let availableIndices = DAILY_MESSAGES.map((_, index) => index).filter(
      (index) => !tracker.usedIndices.includes(index)
    );

    // If somehow all are used, reset
    if (availableIndices.length === 0) {
      availableIndices = DAILY_MESSAGES.map((_, index) => index);
      tracker.usedIndices = [];
    }

    // Pick a random unused message
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const selectedMessage = DAILY_MESSAGES[randomIndex];

    // Mark this message as used
    tracker.usedIndices.push(randomIndex);

    // Save updated tracker
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(tracker));

    // Cache this message for this specific date
    await AsyncStorage.setItem(dateMessageKey, selectedMessage);

    return selectedMessage;
  } catch (error) {
    console.error('Error getting daily message:', error);
    // Fallback to a default message
    return 'This day looks free, go and blow some bubbles.';
  }
}

/**
 * Get the total number of available messages
 */
export function getTotalMessageCount(): number {
  return DAILY_MESSAGES.length;
}
