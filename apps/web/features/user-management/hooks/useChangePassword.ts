"use client";

import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../api";
import { type ChangePasswordRequest } from "@tasheen/validation/auth";

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) => changePassword(input),
  });
}
