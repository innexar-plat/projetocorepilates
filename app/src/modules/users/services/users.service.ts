import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { usersRepository } from '../repositories/users.repository';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { sendEmail } from '@/lib/resend';
import type {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ListUsersDto,
} from '../dtos/user.dto';

const BCRYPT_ROUNDS = 12;

export const usersService = {
  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async getByEmail(email: string) {
    const user = await usersRepository.findByEmail(email);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async list(params: ListUsersDto) {
    const skip = (params.page - 1) * params.limit;
    return usersRepository.list({
      skip,
      take: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      order: params.order,
    });
  },

  async create(dto: CreateUserDto): Promise<ReturnType<typeof usersRepository.findById>> {
    const existing = await usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    const user = await usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
    });

    return user;
  },

  async update(id: string, dto: UpdateUserDto) {
    await usersService.getById(id); // ensure exists
    return usersRepository.update(id, dto);
  },

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await usersRepository.findByEmail(
      (await usersService.getById(id)).email,
    );
    if (!user || !user.passwordHash) {
      throw new ValidationError('Cannot change password for this account');
    }

    const isValid = await compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const newPasswordHash = await hash(dto.newPassword, BCRYPT_ROUNDS);
    await usersRepository.updatePassword(id, newPasswordHash);
  },

  async softDelete(id: string) {
    await usersService.getById(id); // ensure exists
    await usersRepository.softDelete(id);
  },

  async verifyPassword(email: string, password: string) {
    const user = await usersRepository.findByEmail(email);
    if (!user || !user.passwordHash) return null;

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) return null;

    // Return user without passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Generates a secure reset token, stores it with a 1-hour expiry,
   * and sends a reset-password email to the user.
   * Always returns success (no email enumeration).
   */
  async forgotPassword(email: string) {
    const user = await usersRepository.findByEmail(email);
    if (!user) return; // silent — never expose whether email exists

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await usersRepository.setPasswordResetToken(user.id, token, expiry);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com'}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your password — Brazilian Core Pilates',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name ?? 'there'},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="font-weight:bold">Reset Password</a></p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you did not request this, please ignore this email. Your password will not change.</p>
        <hr />
        <p style="color:#999;font-size:12px">Brazilian Core Pilates — ${resetUrl}</p>
      `,
    });
  },

  /**
   * Validates a reset token and sets the new password.
   * Clears the token after successful use.
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await usersRepository.findByPasswordResetToken(token);
    if (!user) throw new ValidationError('Invalid or expired reset token');

    const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);
    await usersRepository.updatePassword(user.id, passwordHash);
    await usersRepository.clearPasswordResetToken(user.id);
  },

  async updateRole(id: string, role: 'ADMIN' | 'CLIENT') {
    await usersService.getById(id);
    return usersRepository.updateRole(id, role);
  },
};
