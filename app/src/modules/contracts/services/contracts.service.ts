import { contractsRepository } from '../repositories/contracts.repository';
import { generateContractContent, CONTRACT_VERSION } from '../entities/contract-template';
import { NotFoundError, ConflictError, ForbiddenError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { uploadFile } from '@/lib/minio';
import type { SignContractDto } from '../dtos/contract.dto';

export const contractsService = {
  async getByUserId(userId: string) {
    const contract = await contractsRepository.findByUserId(userId);
    if (!contract) throw new NotFoundError('No contract found');
    return contract;
  },

  /**
   * Creates an unsigned contract for the user, generating the legal content
   * from their profile and user data.
   * Called automatically when the client profile is marked complete.
   */
  async createForUser(userId: string, clientProfileId: string) {
    const existing = await contractsRepository.findByUserId(userId);
    if (existing) return existing; // idempotent

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (!user) throw new NotFoundError('User not found');

    const content = generateContractContent({
      clientName: user.name,
      clientEmail: user.email,
      date: new Date().toISOString(),
    });

    const contract = await contractsRepository.create({
      clientProfileId,
      userId,
      version: CONTRACT_VERSION,
      content,
    });

    logger.info({ userId, contractId: contract.id }, 'Contract created for signing');
    return contract;
  },

  /**
   * Signs the contract.
   * Records typed full name, IP address, user agent, and timestamp as
   * legal evidence under ESIGN Act / eIDAS standards.
   */
  async sign(
    userId: string,
    dto: SignContractDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const contract = await contractsRepository.findByUserId(userId);
    if (!contract) throw new NotFoundError('No contract found');
    if (contract.isSigned) throw new ConflictError('Contract has already been signed');
    if (contract.userId !== userId) throw new ForbiddenError('Access denied');

    const signed = await contractsRepository.sign(contract.id, {
      signatureData: dto.signatureData,
      ipAddress,
      userAgent,
    });

    // Store a copy of the full signed contract as a text file in MinIO
    // for long-term archival. This happens async — failures are logged, not thrown.
    this._archiveSigned(signed.id, userId, contract.content, dto.signatureData).catch(
      (err) => logger.error({ err, contractId: signed.id }, 'Failed to archive signed contract'),
    );

    logger.info(
      { userId, contractId: signed.id, ip: ipAddress },
      'Contract signed successfully',
    );
    return signed;
  },

  /**
   * Archives the signed contract as a text file to MinIO for long-term storage.
   * Returns the stored file URL and updates the contract record.
   */
  async _archiveSigned(
    contractId: string,
    userId: string,
    content: string,
    signatureData: string,
  ) {
    const timestamp = new Date().toISOString();
    const fullText = `${content}\n\n${'═'.repeat(60)}\nDIGITAL SIGNATURE RECORD\n${'═'.repeat(60)}\nSigned by: ${signatureData}\nTimestamp: ${timestamp}\nContract ID: ${contractId}\n`;

    const buffer = Buffer.from(fullText, 'utf-8');
    const filename = `contract-${contractId}.txt`;

    const { url } = await uploadFile(buffer, filename, 'contracts', 'text/plain');
    await contractsRepository.updateFileUrl(contractId, url);
    return url;
  },
};
