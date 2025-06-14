import { useEffect } from "react";
import { tryInitMimir } from ".";

export default function useInitMimir() {
  useEffect(() => {
    tryInitMimir();
  }, []);
}