import yaml
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import re
from config.config import Config

class ConfigLoader:
    @staticmethod
    def load_yaml(file_path: Path) -> Dict:
        """Lade YAML-Datei"""
        if not file_path.exists():
            raise FileNotFoundError(f"Config-Datei nicht gefunden: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    @staticmethod
    def save_yaml(file_path: Path, data: Dict) -> None:
        """Speichere YAML-Datei"""
        with open(file_path, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
    
    @staticmethod
    def load_websites() -> Dict:
        """Lade Webseiten-Konfiguration"""
        return ConfigLoader.load_yaml(Config.WEBSITES_FILE)
    
    @staticmethod
    def load_credentials() -> Dict:
        """Lade Anmeldedaten"""
        return ConfigLoader.load_yaml(Config.CREDENTIALS_FILE)
    
    @staticmethod
    def load_tasks() -> Dict:
        """Lade Aufgaben-Konfiguration"""
        return ConfigLoader.load_yaml(Config.TASKS_FILE)

class TemplateRenderer:
    """Rendert Template-Strings mit Variablen"""
    
    @staticmethod
    def render(template: str, context: Dict[str, Any]) -> str:
        """Rendere einen Template-String"""
        # Ersetze {{variablen}}
        result = template
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            result = result.replace(placeholder, str(value))
        
        # Füge Standard-Variablen hinzu
        result = TemplateRenderer._add_standard_variables(result)
        
        return result
    
    @staticmethod
    def _add_standard_variables(template: str) -> str:
        """Füge Standard-Variablen hinzu"""
        now = datetime.now()
        context = {
            'date': now.strftime('%Y-%m-%d'),
            'time': now.strftime('%H:%M:%S'),
            'datetime': now.strftime('%Y-%m-%d_%H-%M-%S'),
            'year': now.year,
            'month': now.month,
            'day': now.day
        }
        
        result = template
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            result = result.replace(placeholder, str(value))
        
        return result
    
    @staticmethod
    def render_dict(data: Dict, context: Dict[str, Any]) -> Dict:
        """Rendere alle Strings in einem Dictionary"""
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = TemplateRenderer.render(value, context)
            elif isinstance(value, dict):
                result[key] = TemplateRenderer.render_dict(value, context)
            elif isinstance(value, list):
                result[key] = TemplateRenderer.render_list(value, context)
            else:
                result[key] = value
        return result
    
    @staticmethod
    def render_list(data: List, context: Dict[str, Any]) -> List:
        """Rendere alle Strings in einer Liste"""
        result = []
        for item in data:
            if isinstance(item, str):
                result.append(TemplateRenderer.render(item, context))
            elif isinstance(item, dict):
                result.append(TemplateRenderer.render_dict(item, context))
            elif isinstance(item, list):
                result.append(TemplateRenderer.render_list(item, context))
            else:
                result.append(item)
        return result
