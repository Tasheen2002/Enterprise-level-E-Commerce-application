"use client";

import { useMutation } from "@tanstack/react-query";
import { changeEmail } from "../api";
import { type ChangeEmailRequest } from "@tasheen/validation/auth";

export function useChangeEmail() {
  return useMutation({
    mutationFn: (input: ChangeEmailRequest) => changeEmail(input),
  });
}
