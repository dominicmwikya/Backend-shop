import { Injectable, NestMiddleware, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserLog } from "src/Entities/Userlogs";
import { Repository } from "typeorm";
import * as UAParser from 'ua-parser-js';
import { JwtService } from "@nestjs/jwt";
import { Result } from "src/Modules/category/Response/Result";
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(UserLog)
    private readonly logRepository: Repository<UserLog>,
    private readonly jwtService: JwtService
  ) { }
  async use(req: any, res: any, next: (error?: Error | any) => void) {
    const token = req.cookies['access-token'];
    if (!token) {
      throw new NotFoundException('USER TOKEN MISSING!');
    }
    try {
      const userIp = req.ip || req.connection.remoteAddress;
      const accessedUrl = req.originalUrl;
      const userAgent = req.headers['user-agent'];
      const parser = new UAParser(userAgent)
      const os = `${parser.getOS().name} ${parser.getOS().version}`;
      const browser = `${parser.getBrowser().name} ${parser.getBrowser().version} ${parser.getBrowser().version}`;
      const resourceAccessed = this.extractUrl(accessedUrl)
      req['userDetails'] = { userIp, accessedUrl, userAgent, resourceAccessed };

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_KEY_API_KEY,
      });

      const id = payload.email;
      const logs = this.logRepository.create({
        ipAddress: userIp,
        urlAccessed: accessedUrl,
        os: os,
        browser: browser,
        userId: id
      });

      await this.logRepository.save(logs);
    } catch (error) {
      if (error || error instanceof NotFoundException || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(500).json(new Result(false, `${error.message}`));
      }
    }
    next();
  }

  private extractUrl(url: string) {
    const segments = url.split('/');
    return segments[segments.length - 1] || 'unknown';
  }
}