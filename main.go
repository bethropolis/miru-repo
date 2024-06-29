package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"regexp"
	"strings"
)

type TestResult struct {
	Status string `json:"status"`
}

func main() {
	extensions := readRepoExtensions()

	testResults := readTestResults()

	totalTests, passedTests, failedTests := calculateTestStats(testResults)

	f, err := os.Create("index.json")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	b, err := json.MarshalIndent(extensions, "", " ")
	if err != nil {
		log.Fatal(err)
	}
	f.Write(b)

	f2, err2 := os.Create("README.md")
	if err2 != nil {
		log.Fatal(err2)
	}
	defer f2.Close()

	readme := fmt.Sprintf(`
# Miru-Repo

Miru extensions repository | [Miru App Download](https://github.com/miru-project/miru-app) |

[![Total - %d](https://img.shields.io/static/v1?label=Total&message=%d&style=for-the-badge&labelColor=0077b6&color=0077b6)](#)
[![passed - %d](https://img.shields.io/static/v1?label=Passed&message=%d&style=for-the-badge&labelColor=38b000&color=38b000)](#)
[![failed - %d](https://img.shields.io/static/v1?label=Failed&message=%d&style=for-the-badge&labelColor=da1e37&color=da1e37)](#)


## List
|  Name   | Package | Version | Author | Language | Type | Test | Source |
|  ----   | ---- | --- | ---  | ---  | --- | --- | --- |
`, totalTests, totalTests, passedTests, passedTests, failedTests, failedTests)

	for _, v := range extensions {
		url := fmt.Sprintf("[Source Code](%s)", "https://github.com/miru-project/repo/blob/main/repo/"+v["url"])
		nsfw := v["nsfw"] == "true"
		if nsfw {
			continue
		}
		testEmoji := checkTestStatus(v["package"], testResults)
		readme += fmt.Sprintf("| %s | %s | %s | %s | %s | %s | %s | %s |\n", v["name"], v["package"], v["version"], v["author"], v["lang"], v["type"], testEmoji, url)
	}
	f2.WriteString(readme)
}

func readRepoExtensions() []map[string]string {
	de, err := os.ReadDir("repo")
	if err != nil {
		log.Fatal(err)
	}
	var extensions []map[string]string
	for _, de2 := range de {
		b, err := os.ReadFile(path.Join("repo", de2.Name()))
		if err != nil {
			log.Println("error:", err)
			continue
		}
		r, _ := regexp.Compile(`MiruExtension([\s\S]+?)/MiruExtension`)
		data := r.FindAllString(string(b), -1)
		if len(data) < 1 {
			log.Println("error: not extension")
			continue
		}
		lines := strings.Split(data[0], "\n")
		extension := make(map[string]string)
		for _, v := range lines {
			if len(v) > 4 && v[:4] == "// @" {
				s := strings.Split(v[4:], " ")
				extension[s[0]] = strings.Trim(s[len(s)-1], "\r")
			}
		}
		extension["url"] = de2.Name()
		extensions = append(extensions, extension)
	}
	return extensions
}

func readTestResults() map[string]TestResult {
	jsonFile, err := os.Open("lib/test.json")
	if err != nil {
		log.Println("Warning: test.json does not exist")
		return map[string]TestResult{} // return an empty map
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var results map[string]TestResult
	json.Unmarshal(byteValue, &results)

	return results
}

func calculateTestStats(testResults map[string]TestResult) (total, passed, failed int) {
	for _, result := range testResults {
		total++
		if result.Status == "pass" {
			passed++
		} else if result.Status == "fail" {
			failed++
		}
	}
	return total, passed, failed
}

func checkTestStatus(packageName string, testResults map[string]TestResult) string {
	result, exists := testResults[packageName]
	if !exists {
		return "--"
	}
	
	if result.Status == "pass" {
		return "✅"
	} else if result.Status == "fail" {
		return "❌"
	}

	return "--"
}
