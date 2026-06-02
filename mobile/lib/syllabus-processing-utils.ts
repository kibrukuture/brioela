import { Alert } from 'react-native';
import { processSyllabusImages } from '@/lib/api/syllabus-api';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { createClass } from '@/lib/services/class-service';
import { getOrCreateSemester } from '@/lib/services/semester-service';
import { parseDate, now, parseTime } from '@/lib/date-time-utils';
import dayjs from 'dayjs';
import * as Burnt from 'burnt';
import { Realm } from '@realm/react';

// AI Response Types (matching backend Zod schemas)
interface AIScheduleEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "9:00 AM"
  endTime: string; // "10:15 AM"
}

interface ProcessedScheduleEntry {
  id: number;
  days: string[];
  startTime: string;
  endTime: string;
}

interface AISemester {
  label: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
}

interface AIClass {
  name: string;
  courseCode?: string;
  professor?: string;
  location?: string;
  onlineLink?: string;
  notes?: string;
  semester: AISemester;
  schedule: AIScheduleEntry[];
  colorTag?: string;
  reminderPref?:
    | 'At start'
    | '5 minutes before'
    | '10 minutes before'
    | '15 minutes before'
    | '30 minutes before'
    | '1 hour before';
}

// Current Semester Types
interface CurrentSemester {
  label: string;
  startDate: Date;
  endDate: Date;
}

// Validation Result Types
interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  error?: string;
}

// --- VALIDATION FUNCTIONS ---
const validateAIResponse = (aiClasses: unknown): ValidationResult<AIClass[]> => {
  console.log('=== VALIDATE AI RESPONSE ===');
  console.log('aiClasses type:', typeof aiClasses);
  console.log('aiClasses isArray:', Array.isArray(aiClasses));
  console.log('aiClasses length:', Array.isArray(aiClasses) ? aiClasses.length : 'N/A');
  console.log('aiClasses:', aiClasses);

  if (!Array.isArray(aiClasses)) {
    console.log('Validation failed: Invalid AI response format');
    return {
      isValid: false,
      error: 'Unable to read the document. Please try uploading a clearer image.',
    };
  }

  if (aiClasses.length === 0) {
    console.log('No classes found in document');
    return {
      isValid: false,
      error: 'No classes found in this document. Please upload a syllabus or academic schedule.',
    };
  }

  console.log('Validation passed: AI response is valid');
  console.log('===============================');
  return { isValid: true, data: aiClasses as AIClass[] };
};

const validateClass = (aiClass: unknown): ValidationResult<AIClass> => {
  console.log('=== VALIDATE CLASS ===');
  console.log('aiClass type:', typeof aiClass);
  console.log('aiClass:', aiClass);

  if (!aiClass || typeof aiClass !== 'object') {
    console.log('Validation failed: Invalid class object');
    return {
      isValid: false,
      error: 'Unable to read class information. Please try a different document.',
    };
  }

  const classObj = aiClass as Record<string, unknown>;
  console.log('classObj.name:', classObj.name);
  console.log('classObj.schedule:', classObj.schedule);

  if (!classObj.name || typeof classObj.name !== 'string' || classObj.name.trim() === '') {
    console.log('Validation failed: Class name is required');
    return { isValid: false, error: 'Missing class name. Please upload a complete syllabus.' };
  }

  if (!classObj.schedule || !Array.isArray(classObj.schedule) || classObj.schedule.length === 0) {
    console.log('Validation failed: Class schedule is required');
    return {
      isValid: false,
      error: 'Missing class schedule. Please upload a complete syllabus.',
    };
  }

  console.log('Validation passed: Class is valid');
  console.log('=======================');
  return { isValid: true, data: classObj as unknown as AIClass };
};

const validateScheduleEntry = (
  entry: unknown,
  className: string,
  index: number
): ValidationResult<AIScheduleEntry> => {
  if (!entry || typeof entry !== 'object') {
    return { isValid: false, error: `Invalid schedule entry ${index} for class ${className}` };
  }

  const scheduleEntry = entry as Record<string, unknown>;

  if (!scheduleEntry.day || typeof scheduleEntry.day !== 'string') {
    return {
      isValid: false,
      error: `Missing day in schedule entry ${index} for class ${className}`,
    };
  }

  const validDays: AIScheduleEntry['day'][] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  if (!validDays.includes(scheduleEntry.day as AIScheduleEntry['day'])) {
    return {
      isValid: false,
      error: `Invalid day "${scheduleEntry.day}" in schedule entry ${index} for class ${className}`,
    };
  }

  if (!scheduleEntry.startTime || typeof scheduleEntry.startTime !== 'string') {
    return {
      isValid: false,
      error: `Missing start time in schedule entry ${index} for class ${className}`,
    };
  }

  if (!scheduleEntry.endTime || typeof scheduleEntry.endTime !== 'string') {
    return {
      isValid: false,
      error: `Missing end time in schedule entry ${index} for class ${className}`,
    };
  }

  return { isValid: true, data: scheduleEntry as unknown as AIScheduleEntry };
};

// --- DATA PROCESSING FUNCTIONS ---
const getCurrentSemester = (): CurrentSemester => {
  console.log('=== GET CURRENT SEMESTER ===');
  const currentDate = now();
  console.log('currentDate:', currentDate);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  console.log('Current semester calculation:', { currentDate, currentYear, currentMonth });

  if (currentMonth >= 8) {
    console.log('Determined: Fall semester');
    // Aug-Dec: Fall semester
    console.log('Parsing start date:', `${currentYear}-08-15`);
    const startDate = parseDate(`${currentYear}-08-15`); // Aug 15
    console.log('Parsing end date:', `${currentYear}-12-15`);
    const endDate = parseDate(`${currentYear}-12-15`); // Dec 15
    console.log('Fall semester dates:', { startDate, endDate });
    console.log('=============================');
    return {
      label: `Fall ${currentYear}`,
      startDate,
      endDate,
    };
  } else if (currentMonth >= 0 && currentMonth <= 4) {
    // Jan-May: Spring semester
    const startDate = parseDate(`${currentYear}-01-15`); // Jan 15
    const endDate = parseDate(`${currentYear}-05-15`); // May 15
    console.log('Spring semester dates:', { startDate, endDate });
    return {
      label: `Spring ${currentYear}`,
      startDate,
      endDate,
    };
  } else {
    // Jun-Jul: Summer semester
    const startDate = parseDate(`${currentYear}-06-01`); // Jun 1
    const endDate = parseDate(`${currentYear}-08-15`); // Aug 15
    console.log('Summer semester dates:', { startDate, endDate });
    return {
      label: `Summer ${currentYear}`,
      startDate,
      endDate,
    };
  }
};

const parseSemester = (
  aiSemester: AISemester,
  fallback: CurrentSemester
): { label: string; startDate: Date; endDate: Date } => {
  try {
    console.log('Parsing semester:', aiSemester);
    const startDate = parseDate(aiSemester.startDate);
    const endDate = parseDate(aiSemester.endDate);
    console.log('Parsed dates:', { startDate, endDate });
    return {
      label: aiSemester.label.trim(),
      startDate,
      endDate,
    };
  } catch (error) {
    console.warn('Error parsing semester dates, using fallback:', error);
    return {
      label: fallback.label,
      startDate: fallback.startDate,
      endDate: fallback.endDate,
    };
  }
};

const processSchedule = (
  schedule: AIScheduleEntry[],
  className: string
): ProcessedScheduleEntry[] => {
  console.log('=== PROCESS SCHEDULE ===');
  console.log('className:', className);
  console.log('schedule:', schedule);
  console.log('schedule length:', schedule.length);

  const processedSchedule: ProcessedScheduleEntry[] = [];

  for (let index = 0; index < schedule.length; index++) {
    console.log(`Processing schedule entry ${index}:`, schedule[index]);
    const entry = schedule[index];
    const validation = validateScheduleEntry(entry, className, index);

    if (!validation.isValid) {
      console.warn(`Schedule entry ${index} validation failed:`, validation.error);
      continue;
    }

    const validEntry = validation.data!;
    console.log(`Schedule entry ${index} validated:`, validEntry);

    try {
      // Convert day names to lowercase abbreviations
      const dayMap: Record<AIScheduleEntry['day'], string> = {
        Monday: 'mon',
        Tuesday: 'tue',
        Wednesday: 'wed',
        Thursday: 'thu',
        Friday: 'fri',
        Saturday: 'sat',
        Sunday: 'sun',
      };

      // Parse time strings like "9:00 AM" into Date objects
      console.log('Parsing times:', {
        startTime: validEntry.startTime,
        endTime: validEntry.endTime,
      });
      console.log('Using now() as reference date:', now());

      try {
        const startTime = parseTime(validEntry.startTime, now());
        console.log('Start time parsed successfully:', startTime);

        const endTime = parseTime(validEntry.endTime, now());
        console.log('End time parsed successfully:', endTime);

        console.log('Both times parsed successfully');
      } catch (parseError) {
        console.error('Time parsing failed:', parseError);
        console.error('Failed to parse startTime:', validEntry.startTime);
        console.error('Failed to parse endTime:', validEntry.endTime);
        throw parseError;
      }

      const startTime = parseTime(validEntry.startTime, now());
      const endTime = parseTime(validEntry.endTime, now());
      console.log('Final parsed times:', { startTime, endTime });

      // Validate that end time is after start time
      if (endTime <= startTime) {
        console.warn(`Invalid time range in schedule entry ${index} for class ${className}`);
        continue;
      }

      processedSchedule.push({
        id: dayjs().valueOf() + index,
        days: [dayMap[validEntry.day]],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
    } catch (error) {
      console.warn(`Error parsing times in schedule entry ${index} for class ${className}:`, error);
      continue;
    }
  }

  return processedSchedule;
};

const convertToClassData = (
  aiClass: AIClass,
  semester: { label: string; startDate: Date; endDate: Date },
  schedule: ProcessedScheduleEntry[],
  realm: Realm
) => {
  // Get or create semester using centralized service
  const semesterYear = semester.startDate.getFullYear();
  const semesterName = semester.label.split(' ')[0] as 'Spring' | 'Summer' | 'Fall';
  const semesterObj = getOrCreateSemester(realm, semesterName, semesterYear);

  return {
    name: aiClass.name.trim(),
    notes: aiClass.notes?.trim() || undefined,
    courseCode: aiClass.courseCode?.trim() || undefined,
    professor: aiClass.professor?.trim() || undefined,
    location: aiClass.location?.trim() || undefined,
    onlineLink: aiClass.onlineLink?.trim() || undefined,
    reminderPref: aiClass.reminderPref || 'At start',
    colorTag: aiClass.colorTag || undefined,
    semesterId: semesterObj._id,
    schedule,
  };
};

// --- MAIN ORCHESTRATOR ---
const processAIClasses = async (aiClasses: unknown, realm: Realm): Promise<void> => {
  console.log('=== PROCESS AI CLASSES FUNCTION CALLED ===');
  console.log('aiClasses:', aiClasses);
  console.log('aiClasses type:', typeof aiClasses);
  console.log('aiClasses length:', Array.isArray(aiClasses) ? aiClasses.length : 'not array');

  try {
    console.log('processAIClasses called with:', aiClasses);

    // Validate AI response structure
    const responseValidation = validateAIResponse(aiClasses);
    if (!responseValidation.isValid) {
      throw new Error(responseValidation.error);
    }

    const validClasses = responseValidation.data!;
    console.log('Valid classes:', validClasses);

    const currentSemester = getCurrentSemester();
    console.log('Current semester:', currentSemester);

    for (const aiClass of validClasses) {
      console.log('Processing class:', aiClass.name);

      // Validate individual class
      const classValidation = validateClass(aiClass);
      if (!classValidation.isValid) {
        console.warn(`Skipping invalid class: ${classValidation.error}`);
        continue;
      }

      const validClass = classValidation.data!;
      console.log('Valid class:', validClass);

      // Process schedule
      console.log('Processing schedule for:', validClass.name);
      const processedSchedule = processSchedule(validClass.schedule, validClass.name);
      console.log('Processed schedule:', processedSchedule);

      if (processedSchedule.length === 0) {
        console.warn(`Skipping class with no valid schedule items: ${validClass.name}`);
        continue;
      }

      // Parse semester
      console.log('Parsing semester for:', validClass.name);
      const semester = parseSemester(validClass.semester, currentSemester);
      console.log('Parsed semester:', semester);

      // Convert to ClassData
      console.log('Converting to ClassData for:', validClass.name);
      const classData = convertToClassData(validClass, semester, processedSchedule, realm);
      console.log('ClassData:', classData);

      // Create class using shared helper with calendar sync enabled
      console.log('Calling createClass for:', validClass.name);
      const createdClass = createClass(realm, {
        name: classData.name,
        semesterId: classData.semesterId,
        courseCode: classData.courseCode,
        professor: classData.professor,
        location: classData.location,
        onlineLink: classData.onlineLink,
        colorTag: classData.colorTag,
        notes: classData.notes,
        schedule: classData.schedule.map((item) => ({
          day: item.days[0], // Take first day
          startTime: item.startTime,
          endTime: item.endTime,
        })),
        reminderPref: classData.reminderPref,
      });

      if (createdClass) {
        console.log('Successfully created class:', validClass.name, createdClass._id);
      }
    }
  } catch (error) {
    console.error('Error processing AI classes:', error);
    throw error;
  }
};

// --- MAIN PROCESSING FUNCTION ---
export const processSyllabusData = async (
  images: { id: string; uri: string }[],
  realm: Realm,
  abortSignal?: AbortSignal
): Promise<void> => {
  console.log('=== PROCESS SYLLABUS DATA START ===');

  if (images.length === 0) {
    console.log('No images found, showing alert');
    Alert.alert('No Images', 'Please select at least one image before processing.');
    return;
  }

  console.log('Getting access token...');
  const accessToken = useAuthStore.getState().session?.access_token;
  if (!accessToken) {
    console.log('No access token found, showing alert');
    Alert.alert('Error', 'No valid session token');
    return;
  }
  console.log('Access token found:', accessToken.substring(0, 20) + '...');

  console.log('Starting syllabus processing...');
  console.log('Images count:', images.length);
  console.log('Images:', images);

  console.log('Calling processSyllabusImages API...');
  console.log('About to call processSyllabusImages with:', {
    imagesCount: images.length,
    accessTokenLength: accessToken.length,
    images,
  });

  let result;
  try {
    result = await processSyllabusImages(images, accessToken, abortSignal);
    console.log('API call completed successfully');
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result));
    console.log('Result:', result);
  } catch (apiError) {
    console.error('API call failed:', apiError);

    // Check if request was aborted
    if (apiError instanceof Error && apiError.name === 'AbortError') {
      console.log('Request was aborted by user');
      return; // Don't show error for aborted requests
    }

    throw apiError;
  }

  console.log('=== API RESPONSE ===');
  console.log('Success:', result.success);
  console.log('Data:', result.data);
  console.log('Error:', result.error);
  console.log('Validation errors:', result.validationErrors);

  console.log('About to stringify result...');
  try {
    const stringified = JSON.stringify(result, null, 2);
    console.log('Stringify successful, length:', stringified.length);
    console.log('Full response:', stringified);
  } catch (stringifyError) {
    console.error('JSON.stringify failed:', stringifyError);
    console.log('Result object keys:', Object.keys(result));
    console.log('Result type:', typeof result);
  }

  console.log('===================');

  console.log('=== REACHED CONDITION CHECK ===');
  console.log('Checking result conditions...');
  console.log('result.success:', result.success);
  console.log('result.data:', !!result.data);
  console.log('result.data.classes:', !!result.data?.classes);

  if (result.success && result.data && result.data.classes) {
    console.log('All conditions met, proceeding with AI class processing');
    console.log('Classes to process:', result.data.classes.length);

    // Process AI response and create classes in Realm
    console.log('About to call processAIClasses with:', result.data.classes);
    try {
      await processAIClasses(result.data.classes, realm);
      console.log('processAIClasses completed successfully');

      console.log('Showing success toast...');
      Burnt.toast({
        title: 'Classes Added Successfully!',
        preset: 'done',
        haptic: 'success',
        duration: 3,
      });
    } catch (processError) {
      console.error('processAIClasses failed:', processError);

      // Show user-friendly error message
      const errorMessage =
        processError instanceof Error
          ? processError.message
          : 'Something went wrong. Please try again.';
      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    }
  } else {
    console.log('Conditions not met, showing error alert');
    console.log('result.success:', result.success);
    console.log('result.data:', result.data);
    console.log('result.error:', result.error);
    Alert.alert(
      'Upload Failed',
      result.error || 'Unable to process your document. Please try again.'
    );
  }
};
