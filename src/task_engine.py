from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from src.utils import ConfigLoader, TemplateRenderer

class TaskEngine:
    """Dynamische Aufgaben-Engine basierend auf YAML-Konfiguration"""
    
    def __init__(self, driver, context: Dict[str, Any] = None):
        self.driver = driver
        self.context = context or {}
        self.variables = {}  # Für zwischengespeicherte Werte
        
    def execute_task(self, task_id: str) -> bool:
        """Führe eine bestimmte Aufgabe aus"""
        tasks_config = ConfigLoader.load_tasks()
        
        if task_id not in tasks_config.get('tasks', {}):
            print(f"Aufgabe '{task_id}' nicht gefunden")
            return False
        
        task = tasks_config['tasks'][task_id]
        
        if not task.get('enabled', True):
            print(f"Aufgabe '{task_id}' ist deaktiviert")
            return False
        
        print(f"Starte Aufgabe: {task.get('name', task_id)}")
        print(f"Beschreibung: {task.get('description', '')}")
        
        # Füge Task-Kontext hinzu
        task_context = self.context.copy()
        task_context.update({
            'task_id': task_id,
            'task_name': task.get('name', task_id)
        })
        
        # Führe Schritte aus
        steps = task.get('steps', [])
        for i, step in enumerate(steps, 1):
            step = TemplateRenderer.render_dict(step, task_context)
            if not self._execute_step(step, i, len(steps)):
                print(f"Schritt {i} fehlgeschlagen")
                return False
        
        print(f"Aufgabe '{task_id}' erfolgreich abgeschlossen")
        return True
    
    def execute_all_enabled_tasks(self) -> bool:
        """Führe alle aktivierten Aufgaben aus"""
        tasks_config = ConfigLoader.load_tasks()
        all_success = True
        
        for task_id, task in tasks_config.get('tasks', {}).items():
            if task.get('enabled', True):
                success = self.execute_task(task_id)
                if not success:
                    all_success = False
                    print(f"Aufgabe '{task_id}' fehlgeschlagen")
        
        return all_success
    
    def _execute_step(self, step: Dict, step_num: int, total_steps: int) -> bool:
        """Führe einen einzelnen Schritt aus"""
        action = step.get('action')
        
        if not action:
            print(f"Schritt {step_num}: Keine Aktion definiert")
            return False
        
        print(f"Schritt {step_num}/{total_steps}: {action}")
        
        try:
            # Mapping von Aktionen zu Methoden
            action_methods = {
                'navigate': self._action_navigate,
                'click': self._action_click,
                'input': self._action_input,
                'wait': self._action_wait,
                'screenshot': self._action_screenshot,
                'extract_text': self._action_extract_text,
                'element_exists': self._action_element_exists,
                'execute_script': self._action_execute_script,
                'log': self._action_log,
                'if': self._action_if,
                'loop': self._action_loop,
                'select': self._action_select,
                'hover': self._action_hover,
                'scroll': self._action_scroll
            }
            
            if action in action_methods:
                return action_methods[action](step)
            else:
                print(f"Unbekannte Aktion: {action}")
                return False
                
        except Exception as e:
            print(f"Fehler bei Aktion '{action}': {e}")
            return False
    
    # === Aktionen ===
    
    def _action_navigate(self, step: Dict) -> bool:
        """Navigiere zu einer URL"""
        url = step.get('url')
        wait = step.get('wait', 3)
        
        if not url:
            print("Keine URL angegeben")
            return False
        
        print(f"Navigiere zu: {url}")
        self.driver.get(url)
        time.sleep(wait)
        return True
    
    def _action_click(self, step: Dict) -> bool:
        """Klicke auf ein Element"""
        selector = step.get('selector')
        wait = step.get('wait', 1)
        
        if not selector:
            print("Kein Selector angegeben")
            return False
        
        try:
            element = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
            )
            element.click()
            time.sleep(wait)
            return True
        except TimeoutException:
            print(f"Element nicht gefunden oder nicht klickbar: {selector}")
            return False
    
    def _action_input(self, step: Dict) -> bool:
        """Gebe Text in ein Feld ein"""
        selector = step.get('selector')
        value = step.get('value')
        
        if not selector or value is None:
            print("Selector oder Wert fehlt")
            return False
        
        try:
            element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            element.clear()
            element.send_keys(value)
            return True
        except TimeoutException:
            print(f"Element nicht gefunden: {selector}")
            return False
    
    def _action_wait(self, step: Dict) -> bool:
        """Warte eine bestimmte Zeit"""
        seconds = step.get('seconds', step.get('wait', 1))
        time.sleep(seconds)
        return True
    
    def _action_screenshot(self, step: Dict) -> bool:
        """Mache einen Screenshot"""
        filename = step.get('filename', f'screenshot_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
        
        # Erstelle Screenshots-Verzeichnis
        screenshots_dir = Path('screenshots')
        screenshots_dir.mkdir(exist_ok=True)
        
        filepath = screenshots_dir / filename
        self.driver.save_screenshot(str(filepath))
        print(f"Screenshot gespeichert: {filename}")
        return True
    
    def _action_extract_text(self, step: Dict) -> bool:
        """Extrahiere Text von einem Element"""
        selector = step.get('selector')
        variable_name = step.get('variable_name', 'extracted_text')
        
        if not selector:
            print("Kein Selector angegeben")
            return False
        
        try:
            element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            text = element.text
            
            # Speichere in Variablen
            self.variables[variable_name] = text
            
            # Optional: In Datei speichern
            if step.get('save_to_file', False):
                filename = step.get('filename', f'{variable_name}_{datetime.now().strftime("%Y%m%d")}.txt')
                output_dir = Path('output')
                output_dir.mkdir(exist_ok=True)
                
                with open(output_dir / filename, 'w', encoding='utf-8') as f:
                    f.write(text)
            
            print(f"Text extrahiert ({variable_name}): {text[:100]}...")
            return True
            
        except TimeoutException:
            print(f"Element nicht gefunden: {selector}")
            return False
    
    def _action_element_exists(self, step: Dict) -> bool:
        """Prüfe ob ein Element existiert und führe entsprechende Aktionen aus"""
        selector = step.get('selector')
        
        if not selector:
            print("Kein Selector angegeben")
            return False
        
        try:
            element = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            # Element existiert
            if_exists = step.get('if_exists', [])
            for action in if_exists:
                self._execute_step(action, 0, 0)
            return True
        except TimeoutException:
            # Element existiert nicht
            if_not_exists = step.get('if_not_exists', [])
            for action in if_not_exists:
                self._execute_step(action, 0, 0)
            return True
    
    def _action_execute_script(self, step: Dict) -> bool:
        """Führe JavaScript aus"""
        script = step.get('script')
        
        if not script:
            print("Kein Script angegeben")
            return False
        
        try:
            result = self.driver.execute_script(script)
            print(f"Script ausgeführt. Ergebnis: {result}")
            return True
        except Exception as e:
            print(f"Script-Fehler: {e}")
            return False
    
    def _action_log(self, step: Dict) -> bool:
        """Logge eine Nachricht"""
        message = step.get('message', '')
        level = step.get('level', 'INFO').upper()
        
        # Rendere Variablen in der Nachricht
        for var_name, var_value in self.variables.items():
            message = message.replace(f'{{{{{var_name}}}}}', str(var_value))
        
        print(f"[{level}] {message}")
        return True
    
    def _action_if(self, step: Dict) -> bool:
        """Bedingte Ausführung"""
        condition = step.get('condition')
        then_steps = step.get('then', [])
        else_steps = step.get('else', [])
        
        # Einfache Bedingungsprüfung (kann erweitert werden)
        condition_met = False
        
        # Prüfe auf Variable-Existenz
        if condition.startswith('var_exists:'):
            var_name = condition[11:]
            condition_met = var_name in self.variables
        
        # Prüfe auf Variable-Wert
        elif '==' in condition:
            var_name, expected_value = condition.split('==', 1)
            var_name = var_name.strip()
            expected_value = expected_value.strip()
            condition_met = self.variables.get(var_name) == expected_value
        
        # Führe entsprechende Schritte aus
        steps_to_execute = then_steps if condition_met else else_steps
        
        for action in steps_to_execute:
            self._execute_step(action, 0, 0)
        
        return True
    
    def _action_loop(self, step: Dict) -> bool:
        """Schleife über Elemente oder feste Anzahl"""
        count = step.get('count', 1)
        steps = step.get('steps', [])
        
        for i in range(count):
            print(f"Schleife Iteration {i+1}/{count}")
            for action in steps:
                # Füge Schleifen-Index zum Kontext hinzu
                action['_loop_index'] = i + 1
                self._execute_step(action, 0, 0)
        
        return True
    
    def _action_select(self, step: Dict) -> bool:
        """Wähle eine Option in einem Select-Element"""
        selector = step.get('selector')
        option_value = step.get('value')
        
        from selenium.webdriver.support.ui import Select
        
        try:
            element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            select = Select(element)
            select.select_by_value(option_value)
            return True
        except Exception as e:
            print(f"Select-Fehler: {e}")
            return False
    
    def _action_hover(self, step: Dict) -> bool:
        """Hover über ein Element"""
        selector = step.get('selector')
        
        from selenium.webdriver.common.action_chains import ActionChains
        
        try:
            element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            actions = ActionChains(self.driver)
            actions.move_to_element(element).perform()
            return True
        except Exception as e:
            print(f"Hover-Fehler: {e}")
            return False
    
    def _action_scroll(self, step: Dict) -> bool:
        """Scrolle auf der Seite"""
        direction = step.get('direction', 'down')
        pixels = step.get('pixels', 500)
        
        if direction == 'down':
            script = f"window.scrollBy(0, {pixels});"
        elif direction == 'up':
            script = f"window.scrollBy(0, -{pixels});"
        elif direction == 'to_element':
            selector = step.get('selector')
            script = f"document.querySelector('{selector}').scrollIntoView();"
        else:
            script = f"window.scrollBy(0, {pixels});"
        
        self.driver.execute_script(script)
        time.sleep(0.5)
        return True
