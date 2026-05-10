import {
  AuthenticationService,
  AuthResult,
} from "../services/authentication.service";
import { IFirebaseAuthVerifier } from "../services/ifirebase-auth-verifier.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

export interface LoginWithGoogleCommand extends ICommand {
  readonly idToken: string;
}

export class LoginWithGoogleHandler
  implements ICommandHandler<LoginWithGoogleCommand, CommandResult<AuthResult>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly firebaseVerifier: IFirebaseAuthVerifier,
  ) {}

  async handle(
    command: LoginWithGoogleCommand,
  ): Promise<CommandResult<AuthResult>> {
    const identity = await this.firebaseVerifier.verifyIdToken(command.idToken);
    const result = await this.authService.loginWithGoogle({
      email: identity.email,
      emailVerified: identity.emailVerified,
      name: identity.name,
    });
    return CommandResult.success(result);
  }
}
