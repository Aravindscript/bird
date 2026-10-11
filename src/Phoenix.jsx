import React, { forwardRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

const Phoenix = forwardRef(function Phoenix(props, ref) {
  const { scene, animations } = useGLTF("/phoenix.glb");

  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action.reset().play();
    });
  }, [actions]);

  return (
    <group
      ref={ref}
      scale={props.modelScale ?? 0.004}
    >
      <primitive object={scene} 
     />
    </group>
  );
});

export default Phoenix;

useGLTF.preload("/phoenix.glb");