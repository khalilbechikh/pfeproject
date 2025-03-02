import 'reflect-metadata'; // (1) Ensure reflect-metadata is imported
import express, { Request, Response } from 'express'; // (2) Import Express
import container from './di/inversify.config'; // (3) Import InversifyJS container
import { UserRepository } from './repositories/user.repository'; // (4) Import UserRepository
import { Prisma } from '@prisma/client'; // (5) Import Prisma namespace for types

const app = express(); // (6) Initialize Express app
const port = process.env.PORT || 5000; // (7) Define port

app.get('/', async (req: Request, res: Response) => { // (8) Define your existing root route handler
  res.send('Hello from src/index.ts! (UserRepository Tests - Corrected Fields)'); // (8.1) Updated message
});

async function runUserRepositoryTests() { // (9) Function to run UserRepository tests
  const userRepository = container.get<UserRepository>(UserRepository); // (9.1) Resolve UserRepository

  try {
    console.log('\n----- UserRepository Tests -----');

    // Create User Test (Create Operation) - CORRECTED PAYLOAD
    const newUserPayload: Prisma.usersCreateInput = { // (9.2) Define CORRECTED payload for createUser
      username: `testuser_${Date.now()}`, // Unique username using timestamp
      email: `testuser_${Date.now()}@example.com`, // Unique email using timestamp
      password_hash: 'hashed_password_example', // Example hashed password (in real app, hash properly!)
    };
    const createdUser = await userRepository.createUser(newUserPayload); // (9.3) Call createUser
    console.log('createUser Test: User created successfully:', createdUser);

    if (createdUser && createdUser.id) { // Proceed with other tests only if user creation was successful
      const userId = createdUser.id;

      // Find User Test (Read Operation - FindById)
      const foundUser = await userRepository.findById(userId); // (9.4) Call findById
      console.log('findById Test: User found by ID:', foundUser);

      // Update User Test (Update Operation) - CORRECTED PAYLOAD
      const updateUserData: Prisma.usersUpdateInput = { // (9.5) Define CORRECTED payload for updateUser
        username: 'updated_test_username', // Update username instead of name
      };
      const updatedUser = await userRepository.updateUser(userId, updateUserData); // (9.6) Call updateUser
      console.log('updateUser Test: User updated successfully yes yes yes yes :', updatedUser);

      // Delete User Test (Delete Operation)
      const deletedUser = await userRepository.deleteUser(userId); // (9.7) Call deleteUser
      console.log('deleteUser Test: User deleted successfully:', deletedUser);

      // Find User After Delete Test (Verify Delete - FindById again)
      const userAfterDelete = await userRepository.findById(userId); // (9.8) Call findById after delete
      console.log('findById After Delete Test: User after deletion:', userAfterDelete); // Should be null
      if (userAfterDelete === null) {
        console.log('findById After Delete Test: ✅ User successfully deleted and not found.');
      } else {
        console.error('findById After Delete Test: ❌ User was NOT deleted (still found!).');
      }

    } else {
      console.error('createUser Test: ❌ User creation failed, aborting further tests.');
    }

    console.log('----- UserRepository Tests Completed -----');

  } catch (error) {
    console.error('UserRepository Tests Error:', error); // (9.9) Catch and log test errors
  }
}

app.listen(port, async () => { // (10) Start server and run tests after server starts listening
  console.log(`Server running with UserRepository Tests at http://localhost:${port}`);
  await runUserRepositoryTests(); // (10.1) Run UserRepository tests when server starts
});

export default app;