import { AuthenticationService } from "../services/authentication.service";
import { IFirebaseAuthVerifier } from "../services/ifirebase-auth-verifier.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";

/**
 * Verifies the user's phone using a Firebase ID token minted by the
 * client-side `signInWithPhoneNumber` + `confirm(otp)` flow.
 *
 * The phone number is NOT taken from the request body — it's extracted
 * from the verified `phone_number` claim on the token, so a malicious
 * client can't claim ownership of a number they didn't actually
 * receive an SMS code for.
 */
export interface VerifyPhoneCommand extends ICommand {
  readonly userId: string;
  readonly idToken: string;
}

export class VerifyPhoneHandler
  implements ICommandHandler<VerifyPhoneCommand, CommandResult<{ phoneNumber: string }>>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly firebaseVerifier: IFirebaseAuthVerifier,
  ) { }

  async handle(
    command: VerifyPhoneCommand,
  ): Promise<CommandResult<{ phoneNumber: string }>> {
    const identity = await this.firebaseVerifier.verifyPhoneIdToken(
      command.idToken,
    );
    await this.authService.verifyPhone(command.userId, identity.phoneNumber);
    return CommandResult.success({ phoneNumber: identity.phoneNumber });
  }
}
