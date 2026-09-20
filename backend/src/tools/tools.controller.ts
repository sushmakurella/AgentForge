import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';

@Controller('api/tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  create(@Body() createToolDto: CreateToolDto) {
    return this.toolsService.createTool(createToolDto);
  }

  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolsService.deleteTool(id);
  }
}

