import {type ReactNode } from "react";

interface Props{
    children: ReactNode;
}

const Routing = ({children}: Props) => {
  return (
    <div>{children}</div>
  )
}

export default Routing