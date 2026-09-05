"use client";
import Image from "next/image";
import { useState } from "react";
export function PlayerAvatar({
  player,
  large = false,
}: {
  player: { name: string; profileImageUrl?: string };
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const size = large ? 76 : 35;
  return (
    <span className={`avatar ${large ? "large" : ""}`}>
      {player.profileImageUrl && !failed ? (
        <Image
          src={player.profileImageUrl}
          alt={`${player.name} 프로필 사진`}
          width={size}
          height={size}
          unoptimized
          onError={() => setFailed(true)}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        player.name ? player.name.slice(0, 1) : "?"
      )}
    </span>
  );
}
