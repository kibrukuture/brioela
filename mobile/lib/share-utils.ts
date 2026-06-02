import * as Clipboard from 'expo-clipboard';
import * as Burnt from 'burnt';

export const shareNote = async (noteData: {
  title: string;
  subject?: string;
  lastModified: string;
  content?: string;
}) => {
  try {
    // Format the note nicely for sharing
    const formattedContent = `
 ${noteData.title}

${noteData.subject ? `Subject: ${noteData.subject}\n` : ''}Date: ${noteData.lastModified}

${noteData.content || 'No content'}

—
Shared via Schnl     `.trim();

    // Copy to clipboard
    await Clipboard.setStringAsync(formattedContent);

    Burnt.toast({
      title: 'Note copied to clipboard!',
      preset: 'done',
      haptic: 'success',
      duration: 2,
    });
  } catch (error) {
    console.error('Error copying note:', error);
    Burnt.alert({
      title: 'Error',
      message: 'Could not copy note.',
      preset: 'error',
      duration: 2,
    });
  }
};

export const shareAnyContent = async (title: string, content: string) => {
  try {
    const formattedContent = ` ${title}

${content}

—
Shared via Schnl `;

    await Clipboard.setStringAsync(formattedContent);

    Burnt.toast({
      title: 'Content copied to clipboard!',
      preset: 'done',
      haptic: 'success',
      duration: 2,
    });
  } catch (error) {
    console.error('Error copying content:', error);
    Burnt.alert({
      title: 'Error',
      message: 'Could not copy content.',
      preset: 'error',
      duration: 2,
    });
  }
};
