import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessScope, PermissionLevel, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get members of the organization (or all registered users if single workspace)
   */
  async getMembers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            agents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name || u.email.split('@')[0],
      email: u.email,
      role: u.role,
      image: u.image,
      agentsCount: u._count.agents,
      organizationName: u.organization?.name || 'Default Workspace',
      createdAt: u.createdAt,
    }));
  }

  /**
   * Add or invite a user with an assigned role
   */
  async addOrInviteMember(data: { email: string; name?: string; role?: string }) {
    const email = data.email.trim().toLowerCase();
    const role = (data.role?.toUpperCase() || 'MEMBER') as UserRole;
    const name = data.name?.trim() || email.split('@')[0];

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          role,
          name: existing.name || name,
        },
      });
      return {
        message: `Updated role for ${email} to ${role}`,
        user: updated,
      };
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        role,
      },
    });

    return {
      message: `Member ${email} invited with role ${role}`,
      user: newUser,
    };
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(userId: string, role: string) {
    const userRole = (role.toUpperCase() || 'MEMBER') as UserRole;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: userRole },
    });
    return user;
  }

  /**
   * Get permissions and access scope for an Agent
   */
  async getAgentPermissions(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent '${agentId}' not found.`);
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      accessScope: agent.accessScope,
      creator: agent.creator,
      permissions: agent.permissions.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.name || p.user.email.split('@')[0],
        userEmail: p.user.email,
        permissionLevel: p.permissionLevel,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Update Agent access scope and granular user permissions
   */
  async updateAgentPermissions(
    agentId: string,
    data: {
      accessScope?: string;
      permissions?: { userId: string; permissionLevel: string }[];
    },
  ) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent '${agentId}' not found.`);
    }

    const scope = data.accessScope ? (data.accessScope.toUpperCase() as AccessScope) : undefined;

    // Update agent access scope
    if (scope) {
      await this.prisma.agent.update({
        where: { id: agentId },
        data: { accessScope: scope },
      });
    }

    // Update member permission overrides if provided
    if (data.permissions && Array.isArray(data.permissions)) {
      // Clear existing and re-insert
      await this.prisma.agentPermission.deleteMany({
        where: { agentId },
      });

      for (const p of data.permissions) {
        if (p.userId) {
          await this.prisma.agentPermission.create({
            data: {
              agentId,
              userId: p.userId,
              permissionLevel: (p.permissionLevel.toUpperCase() || 'CAN_CHAT') as PermissionLevel,
            },
          });
        }
      }
    }

    return this.getAgentPermissions(agentId);
  }
}

