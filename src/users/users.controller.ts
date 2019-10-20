import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {

    constructor(
        private readonly authService: AuthService,
    ) { }

    @UseGuards(AuthGuard('local'))
    @Post('/auth/login/staff')
    async loginStaff(@Request() req) {
        return req.user;
        // return this.authService.validateStaff()
    }

}
