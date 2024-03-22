from time import time, sleep
import unittest

import requests


class TestAPIs(unittest.TestCase):
    base_url = "http://localhost:8000"
    float_resolution = 1e-4

    def test_add_task(self):
        response = requests.post(f"{self.base_url}/api/tasks/add")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['content-type'], "application/json")

        response_data = response.json()

        self.assertEqual(response_data.get('success', None), True)
        self.assertNotEqual(response_data.get('result', {}).get('id', ""), "")
        self.assertEqual(response_data.get('result', {}).get('message', None), "Task queued.")
    
    def test_get_task_progress(self):
        add_response = requests.post(f"{self.base_url}/api/tasks/add")

        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.headers['content-type'], "application/json")

        add_response_data = add_response.json()

        new_task_id = add_response_data.get('result', {}).get('id', "")

        # Poll repeatedly and get progress
        last_progress = 0
        last_time_elapsed = 0

        for i in range(100):
            get_progress_response = requests.get(f"{self.base_url}/api/tasks/status/{new_task_id}")

            self.assertEqual(get_progress_response.status_code, 200)
            self.assertEqual(get_progress_response.headers['content-type'], "application/json")

            get_progress_response_data = get_progress_response.json()

            self.assertEqual(get_progress_response_data.get('success', None), True)

            task_progress_dict = get_progress_response_data.get('result', {}).get('progress', {})

            current_progress = task_progress_dict.get('progress', None)
            self.assertIsInstance(current_progress, str)

            current_time_elapsed = task_progress_dict.get('timeElapsed', None)
            self.assertIsInstance(current_time_elapsed, str)

            current_progress = float(current_progress)
            current_time_elapsed = float(current_time_elapsed)

            self.assertGreaterEqual(current_progress, last_progress)
            self.assertGreaterEqual(current_time_elapsed, last_time_elapsed)

            if abs(current_progress - 100.0) < self.float_resolution:
                break

            sleep(0.1)

    def test_get_invalid_task_progress(self):
        invalid_task_id = str(time())

        response = requests.get(f"{self.base_url}/api/tasks/status/{invalid_task_id}")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.headers['content-type'], "application/json")

        response_data = response.json()

        self.assertEqual(response_data.get('success', None), False)
        self.assertEqual(response_data.get('error', {}).get('message', None), "Task not found.")


if __name__ == "__main__":
    unittest.main()
