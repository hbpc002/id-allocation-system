"use client";

import React from 'react';
import { FaCogs } from 'react-icons/fa';

export default function LoginButton() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        id="loginButton"
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        onClick={() => {
          const password = prompt('请输入密码:');
          if (password !== null) {
            document.dispatchEvent(new CustomEvent('login-trigger', {
              detail: { password }
            }));
          }
        }}
      >
        <FaCogs size={20} />
      </button>
    </div>
  );
}