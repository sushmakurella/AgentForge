import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('api')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('organization/members')
  async getMembers() {
    return this.orgService.getMembers();
  }

  @Post('organization/members')
  async addOrInviteMember(@Body() body: { email: string; name?: string; role?: string }) {
    return this.orgService.addOrInviteMember(body);
  }

  @Patch('organization/members/:id/role')
  async updateMemberRole(@Param('id') userId: string, @Body() body: { role: string }) {
    return this.orgService.updateMemberRole(userId, body.role);
  }

  @Get('agents/:id/permissions')
  async getAgentPermissions(@Param('id') agentId: string) {
    return this.orgService.getAgentPermissions(agentId);
  }

  @Post('agents/:id/permissions')
  async updateAgentPermissions(
    @Param('id') agentId: string,
    @Body() body: { accessScope?: string; permissions?: { userId: string; permissionLevel: string }[] },
  ) {
    return this.orgService.updateAgentPermissions(agentId, body);
  }
}

