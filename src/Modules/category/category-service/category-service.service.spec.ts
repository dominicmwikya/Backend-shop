import { Test, TestingModule } from '@nestjs/testing';
import { CategoryServiceService } from './category-service.service';

describe('CategoryServiceService', () => {
  let service: CategoryServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryServiceService],
    }).compile();

    service = module.get<CategoryServiceService>(CategoryServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
