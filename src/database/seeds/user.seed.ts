import { DataSource } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { UserType } from '../../common/enum/user-type.enum';
import { AuthProvider } from '../../common/enum/auth-provider.enum';

export const seedUsers = async (dataSource: DataSource): Promise<void> => {
  const userRepository = dataSource.getRepository(User);

  const adminEmail = 'admin@boilerplate.com';
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = userRepository.create({
      email: adminEmail,
      password: 'Admin@123',
      name: 'Administrador',
      userType: UserType.ADMIN,
      authProvider: AuthProvider.LOCAL,
    });
    await userRepository.save(admin);
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }

  const userEmail = 'user@boilerplate.com';
  const existingUser = await userRepository.findOne({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const user = userRepository.create({
      email: userEmail,
      password: 'User@123',
      name: 'Usuario Padrao',
      userType: UserType.USER,
      authProvider: AuthProvider.LOCAL,
    });
    await userRepository.save(user);
    console.log('Default user created successfully');
  } else {
    console.log('Default user already exists');
  }
};
