use std::sync::Mutex;
use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Manager, State, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

struct ActiveShortcut(Mutex<Option<Shortcut>>);

// Helper function to parse shortcut string like "Ctrl+Shift+M", "Alt+Space", "CommandOrControl+Shift+K"
fn parse_shortcut_str(s: &str) -> Option<Shortcut> {
  let parts: Vec<&str> = s.split('+').map(|p| p.trim()).collect();
  let mut modifiers = Modifiers::empty();
  let mut key_code: Option<Code> = None;

  for part in parts {
    match part.to_lowercase().as_str() {
      "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
      "shift" => modifiers |= Modifiers::SHIFT,
      "alt" | "option" => modifiers |= Modifiers::ALT,
      "super" | "cmd" | "command" | "meta" | "win" => modifiers |= Modifiers::SUPER,
      "commandorcontrol" | "cmdorctrl" => {
        #[cfg(target_os = "macos")]
        {
          modifiers |= Modifiers::SUPER;
        }
        #[cfg(not(target_os = "macos"))]
        {
          modifiers |= Modifiers::CONTROL;
        }
      }
      "space" => key_code = Some(Code::Space),
      "enter" => key_code = Some(Code::Enter),
      "escape" | "esc" => key_code = Some(Code::Escape),
      "backspace" => key_code = Some(Code::Backspace),
      "tab" => key_code = Some(Code::Tab),
      // A-Z
      "a" => key_code = Some(Code::KeyA),
      "b" => key_code = Some(Code::KeyB),
      "c" => key_code = Some(Code::KeyC),
      "d" => key_code = Some(Code::KeyD),
      "e" => key_code = Some(Code::KeyE),
      "f" => key_code = Some(Code::KeyF),
      "g" => key_code = Some(Code::KeyG),
      "h" => key_code = Some(Code::KeyH),
      "i" => key_code = Some(Code::KeyI),
      "j" => key_code = Some(Code::KeyJ),
      "k" => key_code = Some(Code::KeyK),
      "l" => key_code = Some(Code::KeyL),
      "m" => key_code = Some(Code::KeyM),
      "n" => key_code = Some(Code::KeyN),
      "o" => key_code = Some(Code::KeyO),
      "p" => key_code = Some(Code::KeyP),
      "q" => key_code = Some(Code::KeyQ),
      "r" => key_code = Some(Code::KeyR),
      "s" => key_code = Some(Code::KeyS),
      "t" => key_code = Some(Code::KeyT),
      "u" => key_code = Some(Code::KeyU),
      "v" => key_code = Some(Code::KeyV),
      "w" => key_code = Some(Code::KeyW),
      "x" => key_code = Some(Code::KeyX),
      "y" => key_code = Some(Code::KeyY),
      "z" => key_code = Some(Code::KeyZ),
      // 0-9
      "0" => key_code = Some(Code::Digit0),
      "1" => key_code = Some(Code::Digit1),
      "2" => key_code = Some(Code::Digit2),
      "3" => key_code = Some(Code::Digit3),
      "4" => key_code = Some(Code::Digit4),
      "5" => key_code = Some(Code::Digit5),
      "6" => key_code = Some(Code::Digit6),
      "7" => key_code = Some(Code::Digit7),
      "8" => key_code = Some(Code::Digit8),
      "9" => key_code = Some(Code::Digit9),
      // F1-F12
      "f1" => key_code = Some(Code::F1),
      "f2" => key_code = Some(Code::F2),
      "f3" => key_code = Some(Code::F3),
      "f4" => key_code = Some(Code::F4),
      "f5" => key_code = Some(Code::F5),
      "f6" => key_code = Some(Code::F6),
      "f7" => key_code = Some(Code::F7),
      "f8" => key_code = Some(Code::F8),
      "f9" => key_code = Some(Code::F9),
      "f10" => key_code = Some(Code::F10),
      "f11" => key_code = Some(Code::F11),
      "f12" => key_code = Some(Code::F12),
      _ => {}
    }
  }

  let code = key_code?;
  let mods = if modifiers.is_empty() {
    None
  } else {
    Some(modifiers)
  };
  Some(Shortcut::new(mods, code))
}

#[tauri::command]
fn update_global_shortcut(
  app: AppHandle,
  active_shortcut: State<'_, ActiveShortcut>,
  shortcut_str: String,
) -> Result<String, String> {
  let new_shortcut = parse_shortcut_str(&shortcut_str)
    .ok_or_else(|| format!("ショートカットキーの解析に失敗しました: {}", shortcut_str))?;

  let mut current = active_shortcut.0.lock().map_err(|e| e.to_string())?;

  // Unregister previous shortcut if exists
  if let Some(old_shortcut) = current.take() {
    let _ = app.global_shortcut().unregister(old_shortcut);
  }

  // Register new shortcut with error handling
  let app_handle = app.clone();
  app.global_shortcut().on_shortcut(new_shortcut, move |_app, _shortcut, event| {
    if event.state() == ShortcutState::Pressed {
      if let Some(window) = app_handle.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
          let _ = window.hide();
        } else {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
    }
  }).map_err(|e| format!("ショートカットのバインドに失敗しました (他のアプリと重複している可能性があります): {:?}", e))?;

  app.global_shortcut().register(new_shortcut)
    .map_err(|e| format!("ショートカットの登録に失敗しました (他のアプリで使用中です): {:?}", e))?;

  *current = Some(new_shortcut);
  Ok(shortcut_str)
}

#[tauri::command]
fn exit_app(app: AppHandle) {
  eprintln!("[inmem-memo] Rust exit_app command received. Triggering application cleanup and process exit...");
  app.cleanup_before_exit();
  std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .manage(ActiveShortcut(Mutex::new(None)))
    .invoke_handler(tauri::generate_handler![update_global_shortcut, exit_app])
    .setup(|app| {
      // 1. Build Tray Menu
      const TOGGLE_ID: &str = "toggle_window";
      const QUIT_ID: &str = "quit_app";

      let toggle_item = MenuItem::with_id(app, TOGGLE_ID, "表示 / 非表示 (Toggle)", true, None::<&str>)?;
      let quit_item = MenuItem::with_id(app, QUIT_ID, "終了 (Quit)", true, None::<&str>)?;
      let tray_menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

      // 2. Build Tray Icon using official Tauri v2 include_image! macro
      let tray_icon_image = tauri::include_image!("icons/128x128.png");

      TrayIconBuilder::new()
        .icon(tray_icon_image)
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
          TOGGLE_ID => {
            if let Some(window) = app.get_webview_window("main") {
              if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
              } else {
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
          }
          QUIT_ID => {
            eprintln!("[inmem-memo] Tray Quit selected. Terminating application process...");
            app.cleanup_before_exit();
            std::process::exit(0);
          }
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
              } else {
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
          }
        })
        .build(app)?;

      // 3. Register Default Global Shortcut (Ctrl + Shift + M) with safe fallback
      let initial_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyM);
      let app_handle = app.handle().clone();

      let register_result = app.global_shortcut().on_shortcut(initial_shortcut, move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
          if let Some(window) = app_handle.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
              let _ = window.hide();
            } else {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        }
      });

      if register_result.is_ok() {
        if let Ok(()) = app.global_shortcut().register(initial_shortcut) {
          if let Some(state) = app.try_state::<ActiveShortcut>() {
            if let Ok(mut lock) = state.0.lock() {
              *lock = Some(initial_shortcut);
            }
          }
        } else {
          eprintln!("Warning: Initial shortcut is already registered by another application.");
        }
      } else {
        eprintln!("Warning: Could not bind initial shortcut handler.");
      }

      Ok(())
    })
    .on_window_event(|window, event| {
      // 4. Prevent exit on window close ('x' button) -> Hide to system tray instead
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
