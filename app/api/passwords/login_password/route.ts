import { NextResponse } from 'next/server';
import db from '../../../db';

export async function GET() {
  try {
    console.log('Received request to fetch login password');
    // Query the database for the login password
    const result = db.prepare('SELECT value FROM passwords WHERE key = ?').get('login_password');
    
    if (!result) {
      console.error('No password found in database for key: login_password');
      return NextResponse.json({ error: 'Password not found' }, { status: 404 });
    }
    
    console.log('Successfully retrieved password from database');
    // Return the password value
    return NextResponse.json({ value: result.value });
  } catch (error) {
    console.error('Error fetching password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}