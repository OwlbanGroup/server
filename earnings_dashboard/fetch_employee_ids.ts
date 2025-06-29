import fs from 'fs';
import path from 'path';

const employeeIdsFilePath = path.resolve(__dirname, '../owlban_repos/sample_repo/employee_ids.json');

/**
 * Fetch employee IDs dynamically from a JSON file.
 * This simulates dynamic fetching and can be replaced with API calls or database queries.
 */
export async function fetchEmployeeIds(): Promise<string[]> {
  try {
    const data = fs.readFileSync(employeeIdsFilePath, 'utf-8');
    const employeeIds = JSON.parse(data);
    if (Array.isArray(employeeIds)) {
      return employeeIds;
    } else {
      console.warn('Employee IDs data is not an array, returning empty list.');
      return [];
    }
  } catch (error) {
    console.error('Failed to read employee IDs file:', error);
    return [];
  }
}
